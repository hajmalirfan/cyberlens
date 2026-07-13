import csv
import io
import json
import re
from datetime import datetime
from typing import Dict, List, Optional

import xmltodict


class LogParserService:
    SUPPORTED_TYPES = ["evtx", "sysmon", "csv", "json", "txt", "apache", "firewall"]

    def parse(self, content: str, source_type: str) -> List[Dict]:
        parser_map = {
            "json": self._parse_json,
            "csv": self._parse_csv,
            "evtx": self._parse_evtx,
            "sysmon": self._parse_sysmon,
            "apache": self._parse_apache,
            "firewall": self._parse_firewall,
            "txt": self._parse_txt,
        }
        parser = parser_map.get(source_type.lower(), self._parse_txt)
        return parser(content)

    def _parse_json(self, content: str) -> List[Dict]:
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                if "events" in data:
                    return data["events"]
                if "logs" in data:
                    return data["logs"]
                return [data]
        except json.JSONDecodeError:
            return self._parse_txt(content)
        return []

    def _parse_csv(self, content: str) -> List[Dict]:
        reader = csv.DictReader(io.StringIO(content))
        return [row for row in reader]

    def _parse_evtx(self, content: str) -> List[Dict]:
        events = []
        try:
            doc = xmltodict.parse(content)
            events_raw = doc.get("Events", {}).get("Event", [])
            if isinstance(events_raw, dict):
                events_raw = [events_raw]
            for evt in events_raw:
                system = evt.get("System", {})
                event_data = evt.get("EventData", {}).get("Data", [])
                data_dict = {}
                if isinstance(event_data, list):
                    for item in event_data:
                        if isinstance(item, dict):
                            data_dict[item.get("@Name", "")] = item.get("#text", "")
                elif isinstance(event_data, dict):
                    data_dict[event_data.get("@Name", "")] = event_data.get("#text", "")

                events.append({
                    "event_id": system.get("EventID", {}).get("#text", system.get("EventID", "")),
                    "timestamp": system.get("TimeCreated", {}).get("@SystemTime", ""),
                    "computer": system.get("Computer", ""),
                    "provider": system.get("Provider", {}).get("@Name", ""),
                    "level": system.get("Level", ""),
                    **data_dict,
                })
        except Exception:
            return self._parse_txt(content)
        return events

    def _parse_sysmon(self, content: str) -> List[Dict]:
        return self._parse_evtx(content)

    def _parse_apache(self, content: str) -> List[Dict]:
        events = []
        combined_pattern = re.compile(
            r'(\S+)\s+(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+(\S+)"\s+(\d+)\s+(\d+)(?:\s+"([^"]*)"\s+"([^"]*)")?'
        )
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue
            match = combined_pattern.match(line)
            if match:
                events.append({
                    "ip": match.group(1),
                    "ident": match.group(2),
                    "user": match.group(3),
                    "timestamp": match.group(4),
                    "method": match.group(5),
                    "path": match.group(6),
                    "protocol": match.group(7),
                    "status_code": int(match.group(8)),
                    "size": match.group(9),
                    "referer": match.group(10) or "",
                    "user_agent": match.group(11) or "",
                    "source_type": "apache",
                })
        return events

    def _parse_firewall(self, content: str) -> List[Dict]:
        events = []
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) >= 5:
                events.append({
                    "timestamp": parts[0] if len(parts) > 0 else "",
                    "action": parts[1] if len(parts) > 1 else "",
                    "protocol": parts[2] if len(parts) > 2 else "",
                    "src_ip": parts[3] if len(parts) > 3 else "",
                    "dst_ip": parts[4] if len(parts) > 4 else "",
                    "src_port": parts[5] if len(parts) > 5 else "",
                    "dst_port": parts[6] if len(parts) > 6 else "",
                    "raw": line,
                    "source_type": "firewall",
                })
        return events

    def _parse_txt(self, content: str) -> List[Dict]:
        events = []
        for i, line in enumerate(content.split("\n")):
            line = line.strip()
            if line:
                events.append({
                    "line_number": i + 1,
                    "raw_content": line,
                    "source_type": "txt",
                })
        return events
