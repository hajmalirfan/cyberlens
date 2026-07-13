from datetime import datetime
from typing import Dict, List, Optional

from app.models.normalized_event import NormalizedEvent


class NormalizerService:
    def normalize(self, raw_events: List[Dict], project_id: int, upload_id: int) -> List[dict]:
        normalized = []
        for event in raw_events:
            normalized_event = self._normalize_single(event, project_id, upload_id)
            if normalized_event:
                normalized.append(normalized_event)
        return normalized

    def _normalize_single(self, event: Dict, project_id: int, upload_id: int) -> Optional[dict]:
        source_type = event.get("source_type", "unknown")

        normalizer_map = {
            "evtx": self._normalize_evtx,
            "sysmon": self._normalize_evtx,
            "csv": self._normalize_csv,
            "json": self._normalize_json,
            "apache": self._normalize_apache,
            "firewall": self._normalize_firewall,
            "txt": self._normalize_txt,
        }

        normalizer = normalizer_map.get(source_type, self._normalize_generic)
        return normalizer(event, project_id, upload_id)

    def _parse_timestamp(self, ts: str) -> datetime:
        if not ts:
            return datetime.utcnow()
        formats = [
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%d/%b/%Y:%H:%M:%S %z",
            "%m/%d/%Y %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(ts, fmt)
            except (ValueError, TypeError):
                continue
        return datetime.utcnow()

    def _normalize_evtx(self, event: Dict, project_id: int, upload_id: int) -> dict:
        ts = self._parse_timestamp(event.get("timestamp", ""))
        event_id = str(event.get("event_id", ""))
        return {
            "project_id": project_id,
            "upload_id": upload_id,
            "event_id": event_id,
            "event_name": self._get_evtx_event_name(event_id),
            "timestamp": ts,
            "source_type": "evtx",
            "source_name": event.get("provider", ""),
            "computer_name": event.get("computer", ""),
            "user_name": event.get("SubjectUserName", event.get("TargetUserName", "")),
            "ip_address": event.get("IpAddress", event.get("SourceIp", "")),
            "process_name": event.get("Image", event.get("ProcessName", "")),
            "process_id": self._safe_int(event.get("ProcessId", event.get("NewProcessId", ""))),
            "parent_process": event.get("ParentImage", ""),
            "command_line": event.get("CommandLine", ""),
            "file_path": event.get("TargetFilename", event.get("Image", "")),
            "registry_key": event.get("TargetObject", ""),
            "severity": self._map_level_to_severity(event.get("level", "4")),
            "raw_data": event,
        }

    def _get_evtx_event_name(self, event_id: str) -> str:
        names = {
            "4624": "Successful Logon",
            "4625": "Failed Logon",
            "4634": "Logoff",
            "4648": "Logon with Explicit Credentials",
            "4672": "Admin Logon",
            "4688": "Process Created",
            "4689": "Process Exited",
            "4698": "Scheduled Task Created",
            "4700": "Scheduled Task Enabled",
            "4702": "Scheduled Task Updated",
            "4719": "Audit Policy Changed",
            "4720": "User Account Created",
            "4722": "User Account Enabled",
            "4724": "Password Reset Attempt",
            "4728": "Member Added to Security Group",
            "4732": "Member Added to Local Group",
            "4740": "Account Locked Out",
            "4742": "Computer Account Changed",
            "4756": "Member Added to Universal Group",
            "4776": "Credential Validation",
            "4798": "User's Local Group Membership Enumerated",
            "5140": "Network Share Object Accessed",
            "5145": "Network Share Access Checked",
            "5156": "Windows Filtering Platform Connection",
            "5157": "Windows Filtering Platform Blocked Connection",
            "5158": "Windows Filtering Platform Bind",
            "7045": "Service Installed",
        }
        return names.get(event_id, f"Event {event_id}")

    def _normalize_csv(self, event: Dict, project_id: int, upload_id: int) -> dict:
        return self._normalize_generic(event, project_id, upload_id)

    def _normalize_json(self, event: Dict, project_id: int, upload_id: int) -> dict:
        ts = self._parse_timestamp(event.get("timestamp", event.get("Timestamp", event.get("@timestamp", ""))))
        return {
            "project_id": project_id,
            "upload_id": upload_id,
            "event_id": str(event.get("event_id", event.get("EventID", ""))),
            "event_name": event.get("event_name", event.get("EventName", event.get("name", ""))),
            "timestamp": ts,
            "source_type": event.get("source_type", "json"),
            "source_name": event.get("source", event.get("log_source", "")),
            "computer_name": event.get("computer", event.get("host", event.get("Computer", ""))),
            "user_name": event.get("user", event.get("username", event.get("User", ""))),
            "ip_address": event.get("ip", event.get("src_ip", event.get("IpAddress", ""))),
            "process_name": event.get("process", event.get("Image", "")),
            "process_id": self._safe_int(event.get("process_id", event.get("ProcessId", ""))),
            "parent_process": event.get("parent_process", event.get("ParentImage", "")),
            "command_line": event.get("command_line", event.get("CommandLine", "")),
            "file_path": event.get("file", event.get("file_path", event.get("TargetFilename", ""))),
            "severity": event.get("severity", event.get("level", "info")),
            "raw_data": event,
        }

    def _normalize_apache(self, event: Dict, project_id: int, upload_id: int) -> dict:
        ts = self._parse_timestamp(event.get("timestamp", ""))
        status = int(event.get("status_code", 0))
        severity = "info"
        if status >= 500:
            severity = "critical"
        elif status >= 400:
            severity = "high"
        return {
            "project_id": project_id,
            "upload_id": upload_id,
            "event_id": f"HTTP_{event.get('status_code', '000')}",
            "event_name": f"{event.get('method', '')} {event.get('path', '')} -> {status}",
            "timestamp": ts,
            "source_type": "apache",
            "source_name": "Apache HTTP Server",
            "computer_name": event.get("ip", ""),
            "user_name": event.get("user", ""),
            "ip_address": event.get("ip", ""),
            "severity": severity,
            "raw_data": event,
        }

    def _normalize_firewall(self, event: Dict, project_id: int, upload_id: int) -> dict:
        ts = self._parse_timestamp(event.get("timestamp", ""))
        action = event.get("action", "").lower()
        severity = "high" if action in ("block", "deny", "drop") else "info"
        return {
            "project_id": project_id,
            "upload_id": upload_id,
            "event_id": f"FW_{action.upper()}" if action else "FW_UNKNOWN",
            "event_name": f"Firewall {action} connection",
            "timestamp": ts,
            "source_type": "firewall",
            "source_name": "Firewall",
            "computer_name": event.get("src_ip", ""),
            "ip_address": event.get("src_ip", ""),
            "network_connection": {
                "src_ip": event.get("src_ip", ""),
                "dst_ip": event.get("dst_ip", ""),
                "src_port": event.get("src_port", ""),
                "dst_port": event.get("dst_port", ""),
                "protocol": event.get("protocol", ""),
                "action": action,
            },
            "severity": severity,
            "raw_data": event,
        }

    def _normalize_txt(self, event: Dict, project_id: int, upload_id: int) -> dict:
        return {
            "project_id": project_id,
            "upload_id": upload_id,
            "event_id": f"TXT_{event.get('line_number', 0)}",
            "event_name": "Raw Log Entry",
            "timestamp": datetime.utcnow(),
            "source_type": "txt",
            "severity": "info",
            "raw_data": event,
        }

    def _normalize_generic(self, event: Dict, project_id: int, upload_id: int) -> dict:
        return self._normalize_json(event, project_id, upload_id)

    def _map_level_to_severity(self, level: str) -> str:
        mapping = {
            "1": "critical",
            "2": "high",
            "3": "medium",
            "4": "info",
            "5": "info",
            "0": "info",
        }
        return mapping.get(level, "info")

    def _safe_int(self, value) -> Optional[int]:
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
