from typing import Dict, List

from app.core.database import Neo4jConnection


class GraphService:
    def __init__(self, neo4j: Neo4jConnection):
        self.neo4j = neo4j

    def build_graph(self, project_id: int, events: List[Dict]):
        sess = self.neo4j.create_session()
        if not sess:
            return
        with sess as session:
            session.run("MATCH (n) DETACH DELETE n")

            seen_computers = set()
            seen_users = set()
            seen_ips = set()
            seen_processes = set()
            seen_files = set()

            for event in events:
                computer = event.get("computer_name")
                user = event.get("user_name")
                ip = event.get("ip_address")
                process = event.get("process_name")
                file_path = event.get("file_path")
                parent_process = event.get("parent_process")

                if computer and computer not in seen_computers:
                    session.run(
                        "MERGE (c:Computer {name: $name, project_id: $pid})",
                        name=computer, pid=project_id
                    )
                    seen_computers.add(computer)

                if user and user not in seen_users:
                    session.run(
                        "MERGE (u:User {name: $name, project_id: $pid})",
                        name=user, pid=project_id
                    )
                    seen_users.add(user)

                if ip and ip not in seen_ips:
                    session.run(
                        "MERGE (i:IP {address: $address, project_id: $pid})",
                        address=ip, pid=project_id
                    )
                    seen_ips.add(ip)

                if process and process not in seen_processes:
                    session.run(
                        "MERGE (p:Process {name: $name, project_id: $pid}) "
                        "SET p.pid = $pid_value",
                        name=process, pid=project_id,
                        pid_value=event.get("process_id")
                    )
                    seen_processes.add(process)

                if file_path and file_path not in seen_files:
                    session.run(
                        "MERGE (f:File {path: $path, project_id: $pid})",
                        path=file_path, pid=project_id
                    )
                    seen_files.add(file_path)

                self._create_relationships(session, project_id, event)

    def _create_relationships(self, session, project_id: int, event: Dict):
        computer = event.get("computer_name")
        user = event.get("user_name")
        ip = event.get("ip_address")
        process = event.get("process_name")
        file_path = event.get("file_path")
        parent_process = event.get("parent_process")

        if user and computer:
            session.run("""
                MATCH (u:User {name: $user, project_id: $pid})
                MATCH (c:Computer {name: $computer, project_id: $pid})
                MERGE (u)-[:LOGGED_INTO {timestamp: $ts, event_id: $eid}]->(c)
            """, user=user, computer=computer, pid=project_id,
                        ts=str(event.get("timestamp", "")), eid=event.get("event_id", ""))

        if ip and computer:
            session.run("""
                MATCH (i:IP {address: $ip, project_id: $pid})
                MATCH (c:Computer {name: $computer, project_id: $pid})
                MERGE (i)-[:CONNECTED_TO {timestamp: $ts, event_id: $eid}]->(c)
            """, ip=ip, computer=computer, pid=project_id,
                        ts=str(event.get("timestamp", "")), eid=event.get("event_id", ""))

        if process and computer:
            session.run("""
                MATCH (p:Process {name: $process, project_id: $pid})
                MATCH (c:Computer {name: $computer, project_id: $pid})
                MERGE (p)-[:EXECUTED_ON {timestamp: $ts, event_id: $eid}]->(c)
            """, process=process, computer=computer, pid=project_id,
                        ts=str(event.get("timestamp", "")), eid=event.get("event_id", ""))

        if parent_process and process:
            session.run("""
                MATCH (parent:Process {name: $parent, project_id: $pid})
                MATCH (child:Process {name: $process, project_id: $pid})
                MERGE (parent)-[:SPAWNED {timestamp: $ts}]->(child)
            """, parent=parent_process, process=process, pid=project_id,
                        ts=str(event.get("timestamp", "")))

        if file_path and process:
            session.run("""
                MATCH (f:File {path: $path, project_id: $pid})
                MATCH (p:Process {name: $process, project_id: $pid})
                MERGE (p)-[:ACCESSED {timestamp: $ts, event_id: $eid}]->(f)
            """, path=file_path, process=process, pid=project_id,
                        ts=str(event.get("timestamp", "")), eid=event.get("event_id", ""))

    def get_graph(self, project_id: int) -> Dict:
        with self.neo4j.create_session() as session:
            nodes_result = session.run("""
                MATCH (n)
                WHERE n.project_id = $pid
                RETURN n, labels(n) as labels
                LIMIT 500
            """, pid=project_id)

            nodes = []
            node_map = {}
            for record in nodes_result:
                node = record["n"]
                labels = record["labels"]
                node_id = node.element_id
                props = dict(node)
                label = labels[0] if labels else "Unknown"
                node_map[node_id] = label

                display_name = ""
                if label == "Computer":
                    display_name = props.get("name", "")
                elif label == "User":
                    display_name = props.get("name", "")
                elif label == "IP":
                    display_name = props.get("address", "")
                elif label == "Process":
                    display_name = props.get("name", "")
                elif label == "File":
                    display_name = props.get("path", "")

                nodes.append({
                    "id": node_id,
                    "label": label,
                    "display_name": display_name,
                    "properties": props,
                })

            edges_result = session.run("""
                MATCH (a)-[r]->(b)
                WHERE a.project_id = $pid
                RETURN a.element_id as source, b.element_id as target, type(r) as type, r
                LIMIT 500
            """, pid=project_id)

            edges = []
            for record in edges_result:
                edges.append({
                    "id": f"{record['source']}-{record['target']}-{record['type']}",
                    "source": record["source"],
                    "target": record["target"],
                    "type": record["type"],
                })

            return {"nodes": nodes, "edges": edges}

    def get_attack_path(self, project_id: int) -> List[Dict]:
        with self.neo4j.create_session() as session:
            result = session.run("""
                MATCH path = (start)-[*1..5]->(end)
                WHERE start.project_id = $pid
                AND NOT EXISTS {
                    MATCH (before)-[]->(start)
                    WHERE before.project_id = $pid
                }
                AND NOT EXISTS {
                    MATCH (end)-[]->(after)
                    WHERE after.project_id = $pid
                }
                RETURN path
                LIMIT 20
            """, pid=project_id)

            paths = []
            for record in result:
                path = record["path"]
                path_nodes = []
                for node in path.nodes:
                    props = dict(node)
                    labels = list(node.labels)
                    path_nodes.append({
                        "id": node.element_id,
                        "label": labels[0] if labels else "Unknown",
                        "name": props.get("name") or props.get("address") or props.get("path") or "",
                    })
                paths.append(path_nodes)

            return paths
