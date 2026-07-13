from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from app.models.normalized_event import NormalizedEvent


class CorrelationService:
    def correlate(self, events: List[NormalizedEvent]) -> Dict:
        timeline = self._build_timeline(events)
        sessions = self._group_by_session(events)
        process_trees = self._build_process_trees(events)
        attack_patterns = self._detect_attack_patterns(events)

        return {
            "timeline": timeline,
            "sessions": sessions,
            "process_trees": process_trees,
            "attack_patterns": attack_patterns,
            "total_events": len(events),
            "unique_computers": len(set(e.computer_name for e in events if e.computer_name)),
            "unique_users": len(set(e.user_name for e in events if e.user_name)),
            "time_span": self._calculate_time_span(events),
        }

    def _build_timeline(self, events: List[NormalizedEvent]) -> List[Dict]:
        sorted_events = sorted(events, key=lambda e: e.timestamp if e.timestamp else datetime.min)
        timeline = []
        for event in sorted_events:
            timeline.append({
                "id": event.id,
                "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                "event_name": event.event_name,
                "computer_name": event.computer_name,
                "user_name": event.user_name,
                "ip_address": event.ip_address,
                "severity": event.severity,
                "source_type": event.source_type,
                "mitre_technique": event.mitre_technique_name,
            })
        return timeline

    def _group_by_session(self, events: List[NormalizedEvent]) -> List[Dict]:
        sessions = defaultdict(list)
        for event in events:
            session_key = f"{event.computer_name}|{event.user_name}|{event.ip_address}"
            sessions[session_key].append(event)

        result = []
        for key, session_events in sessions.items():
            computer, user, ip = key.split("|")
            sorted_events = sorted(session_events, key=lambda e: e.timestamp if e.timestamp else datetime.min)
            result.append({
                "computer": computer,
                "user": user,
                "ip": ip,
                "event_count": len(sorted_events),
                "start_time": sorted_events[0].timestamp.isoformat() if sorted_events[0].timestamp else None,
                "end_time": sorted_events[-1].timestamp.isoformat() if sorted_events[-1].timestamp else None,
                "events": [e.id for e in sorted_events],
            })
        return result

    def _build_process_trees(self, events: List[NormalizedEvent]) -> List[Dict]:
        process_map = {}
        for event in events:
            if event.process_name and event.computer_name:
                key = f"{event.computer_name}|{event.process_name}|{event.process_id}"
                process_map[key] = {
                    "computer": event.computer_name,
                    "process": event.process_name,
                    "process_id": event.process_id,
                    "parent_process": event.parent_process,
                    "command_line": event.command_line,
                    "user": event.user_name,
                    "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                }

        trees = []
        for proc in process_map.values():
            parent = proc.get("parent_process")
            if parent:
                proc["parent_key"] = f"{proc['computer']}|{parent}"
            else:
                proc["parent_key"] = None
            trees.append(proc)
        return trees

    def _detect_attack_patterns(self, events: List[NormalizedEvent]) -> List[Dict]:
        patterns = []
        event_ids = [e.event_id for e in events if e.event_id]

        logon_failures = [e for e in events if e.event_id == "4625"]
        if len(logon_failures) > 5:
            patterns.append({
                "pattern": "Brute Force Attack",
                "confidence": "high",
                "description": f"Multiple failed logon attempts ({len(logon_failures)}) detected",
                "event_ids": [e.event_id for e in logon_failures[:10]],
                "severity": "critical",
                "mitre_id": "T1110",
                "mitre_technique": "Brute Force",
            })

        processes = [e for e in events if e.event_id == "4688"]
        suspicious_processes = [
            e for e in processes
            if e.process_name and any(
                kw in e.process_name.lower()
                for kw in ["powershell", "cmd.exe", "wscript", "cscript", "mshta", "rundll32", "regsvr32"]
            )
        ]
        if suspicious_processes:
            patterns.append({
                "pattern": "Suspicious Process Execution",
                "confidence": "medium",
                "description": f"{len(suspicious_processes)} suspicious processes executed",
                "event_ids": [e.event_id for e in suspicious_processes[:10]],
                "severity": "high",
                "mitre_id": "T1059",
                "mitre_technique": "Command and Scripting Interpreter",
            })

        admin_logons = [e for e in events if e.event_id == "4672"]
        if admin_logons:
            patterns.append({
                "pattern": "Privileged Account Usage",
                "confidence": "low",
                "description": f"{len(admin_logons)} privileged logon events detected",
                "event_ids": [e.event_id for e in admin_logons[:10]],
                "severity": "medium",
                "mitre_id": "T1078",
                "mitre_technique": "Valid Accounts",
            })

        new_accounts = [e for e in events if e.event_id == "4720"]
        if new_accounts:
            patterns.append({
                "pattern": "Account Creation",
                "confidence": "medium",
                "description": f"{len(new_accounts)} new user accounts created",
                "event_ids": [e.event_id for e in new_accounts[:10]],
                "severity": "high",
                "mitre_id": "T1136",
                "mitre_technique": "Create Account",
            })

        services = [e for e in events if e.event_id == "7045"]
        if services:
            patterns.append({
                "pattern": "Service Installation",
                "confidence": "medium",
                "description": f"{len(services)} new services installed",
                "event_ids": [e.event_id for e in services[:10]],
                "severity": "high",
                "mitre_id": "T1543",
                "mitre_technique": "Create or Modify System Process",
            })

        return patterns

    def _calculate_time_span(self, events: List[NormalizedEvent]) -> Dict:
        timestamps = [e.timestamp for e in events if e.timestamp]
        if not timestamps:
            return {"start": None, "end": None, "duration_seconds": 0}
        start = min(timestamps)
        end = max(timestamps)
        return {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
        }
