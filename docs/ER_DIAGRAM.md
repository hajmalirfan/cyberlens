# CyberLens Entity Relationship Diagram

## PostgreSQL Schema

```
┌─────────────────────┐
│        users        │
├─────────────────────┤
│ id (PK)             │──┐
│ email (UQ, IX)      │  │
│ username (UQ, IX)   │  │
│ hashed_password     │  │
│ full_name           │  │
│ role (enum)         │  │
│ is_active           │  │
│ avatar_url          │  │
│ created_at          │  │
│ updated_at          │  │
└─────────────────────┘  │
                         │
┌─────────────────────┐  │
│      projects       │  │
├─────────────────────┤  │
│ id (PK)             │  │
│ name                │  │
│ description         │  │
│ owner_id (FK) ──────┘──┘
│ status              │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1
           │
     ┌─────┴──────┐
     │            │
┌────▼─────┐  ┌───▼────────┐
│ uploads  │  │ normalized │
│          │  │   events   │
│ id (PK)  │  ├────────────┤
│ project  │  │ id (PK)    │
│ _id (FK) │  │ project_id │
│ user_id  │  │ upload_id  │
│ filename │  │ log_entry  │
│ file_path│  │  _id (FK)  │
│ file_type│  │ event_id   │
│ file_size│  │ event_name │
│ status   │  │ timestamp  │
│ total    │  │ computer   │
│  _events │  │ user_name  │
│ parsed   │  │ ip_address │
│  _events │  │ process    │
│ error    │  │  _name     │
│  _msg    │  │ process_id │
└────┬─────┘  │ parent     │
     │        │  _process  │
     │ 1      │ command    │
     │        │  _line     │
┌────▼─────┐  │ file_path  │
│log_entries│  │ severity   │
├───────────┤  │ mitre_ids  │
│ id (PK)   │  │ raw_data   │
│ upload_id │  │ session_id │
│ project_id│  │ created_at │
│ source    │  └────────────┘
│  _type    │
│ raw       │       │
│  _content │       │ N
│ parsed    │       │
│  _data    │  ┌────▼────────┐
│ line      │  │investigations│
│  _number  │  ├─────────────┤
│ created_at│  │ id (PK)     │
└───────────┘  │ project_id  │
               │ user_id     │
               │ title       │
               │ status      │
               │ attack_type │
               │ attack_score│
               │ summary     │
               │ timeline    │
               │ evidence    │
               │ affected    │
               │  _systems   │
               │ mitre       │
               │  _mapping   │
               │ recomms     │
               │ confidence  │
               │  _score     │
               │ raw_llm     │
               │  _response  │
               │ started_at  │
               │ completed_at│
               │ created_at  │
               │ updated_at  │
               └──────┬──────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    ┌─────▼─────┐ ┌───▼────┐ ┌───▼──────┐
    │  reports  │ │recs    │ │chat_hist │
    ├───────────┤ ├────────┤ ├──────────┤
    │ id (PK)   │ │ id(PK) │ │ id (PK)  │
    │invest_id  │ │invest  │ │invest_id │
    │project_id │ │project │ │project_id│
    │user_id    │ │title   │ │user_id   │
    │title      │ │desc    │ │role      │
    │type       │ │priority│ │content   │
    │exec_sum   │ │category│ │metadata  │
    │tech_sum   │ │systems │ │created   │
    │pdf_path   │ │status  │ │  _at     │
    └───────────┘ └────────┘ └──────────┘
```

## Neo4j Graph Model

### Node Types

```
(:Computer {name, project_id})
(:User {name, project_id})
(:IP {address, project_id})
(:Process {name, pid, project_id})
(:File {path, project_id})
(:Malware {name, project_id})
```

### Relationship Types

```
(:User)-[:LOGGED_INTO {timestamp, event_id}]->(:Computer)
(:IP)-[:CONNECTED_TO {timestamp, event_id}]->(:Computer)
(:Process)-[:EXECUTED_ON {timestamp, event_id}]->(:Computer)
(:Process)-[:SPAWNED {timestamp}]->(:Process)
(:Process)-[:ACCESSED {timestamp, event_id}]->(:File)
(:Computer)-[:CONNECTED_TO {timestamp, event_id}]->(:Computer)
```

### Attack Path Query

The graph enables multi-hop attack path discovery:

```
MATCH path = (start)-[*1..5]->(end)
WHERE start.project_id = $pid
AND NOT EXISTS { MATCH (before)-[]->(start) WHERE before.project_id = $pid }
AND NOT EXISTS { MATCH (end)-[]->(after) WHERE after.project_id = $pid }
RETURN path
```

This identifies entry points (nodes with no incoming edges) and targets (nodes with no outgoing edges), revealing the complete attack flow.
