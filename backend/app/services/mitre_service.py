from typing import Dict, List


class MitreService:
    TACTICS = {
        "TA0001": "Initial Access",
        "TA0002": "Execution",
        "TA0003": "Persistence",
        "TA0004": "Privilege Escalation",
        "TA0005": "Defense Evasion",
        "TA0006": "Credential Access",
        "TA0007": "Discovery",
        "TA0008": "Lateral Movement",
        "TA0009": "Collection",
        "TA0011": "Command and Control",
        "TA0010": "Exfiltration",
        "TA0040": "Impact",
    }

    TECHNIQUES = {
        "T1059": {
            "name": "Command and Scripting Interpreter",
            "tactic": "TA0002",
            "description": "Adversaries may abuse command and script interpreters to execute commands.",
        },
        "T1059.001": {
            "name": "PowerShell",
            "tactic": "TA0002",
            "description": "Adversaries may abuse PowerShell to execute arbitrary code.",
        },
        "T1078": {
            "name": "Valid Accounts",
            "tactic": "TA0001",
            "description": "Adversaries may steal or obtain valid credentials for initial access.",
        },
        "T1078.003": {
            "name": "Local Accounts",
            "tactic": "TA0001",
            "description": "Adversaries may authenticate with local accounts.",
        },
        "T1110": {
            "name": "Brute Force",
            "tactic": "TA0006",
            "description": "Adversaries may use brute force to gain access to accounts.",
        },
        "T1136": {
            "name": "Create Account",
            "tactic": "TA0003",
            "description": "Adversaries may create accounts to maintain access.",
        },
        "T1543": {
            "name": "Create or Modify System Process",
            "tactic": "TA0003",
            "description": "Adversaries may create or modify system-level processes.",
        },
        "T1543.003": {
            "name": "Windows Service",
            "tactic": "TA0003",
            "description": "Adversaries may create or modify Windows services.",
        },
        "T1505": {
            "name": "Server Software Component",
            "tactic": "TA0003",
            "description": "Adversaries may install malicious components on servers.",
        },
        "T1036": {
            "name": "Masquerading",
            "tactic": "TA0005",
            "description": "Adversaries may manipulate file names to hide malicious activity.",
        },
        "T1562": {
            "name": "Impair Defenses",
            "tactic": "TA0005",
            "description": "Adversaries may disable or impair security tools.",
        },
        "T1003": {
            "name": "OS Credential Dumping",
            "tactic": "TA0006",
            "description": "Adversaries may dump credentials from systems.",
        },
        "T1087": {
            "name": "Account Discovery",
            "tactic": "TA0007",
            "description": "Adversaries may enumerate accounts.",
        },
        "T1082": {
            "name": "System Information Discovery",
            "tactic": "TA0007",
            "description": "Adversaries may gather system information.",
        },
        "T1021": {
            "name": "Remote Services",
            "tactic": "TA0008",
            "description": "Adversaries may use remote services to move laterally.",
        },
        "T1021.006": {
            "name": "Windows Remote Management",
            "tactic": "TA0008",
            "description": "Adversaries may use WinRM for lateral movement.",
        },
        "T1041": {
            "name": "Exfiltration Over C2 Channel",
            "tactic": "TA0010",
            "description": "Adversaries may exfiltrate data over C2 channel.",
        },
        "T1486": {
            "name": "Data Encrypted for Impact",
            "tactic": "TA0040",
            "description": "Adversaries may encrypt data to disrupt availability.",
        },
        "T1569": {
            "name": "System Services",
            "tactic": "TA0002",
            "description": "Adversaries may abuse system services.",
        },
        "T1204": {
            "name": "User Execution",
            "tactic": "TA0002",
            "description": "Adversaries may rely on user interaction for execution.",
        },
        "T1566": {
            "name": "Phishing",
            "tactic": "TA0001",
            "description": "Adversaries may send malicious emails.",
        },
        "T1190": {
            "name": "Exploit Public-Facing Application",
            "tactic": "TA0001",
            "description": "Adversaries may exploit public-facing applications.",
        },
    }

    @classmethod
    def get_technique(cls, technique_id: str) -> Dict:
        return cls.TECHNIQUES.get(technique_id, {})

    @classmethod
    def get_tactic(cls, tactic_id: str) -> str:
        return cls.TACTICS.get(tactic_id, "Unknown")

    @classmethod
    def map_events_to_mitre(cls, events: List[Dict]) -> List[Dict]:
        event_to_technique = {
            "4624": "T1078",
            "4625": "T1110",
            "4672": "T1078",
            "4688": "T1059",
            "4689": "T1059",
            "4698": "T1053",
            "4700": "T1053",
            "4702": "T1053",
            "4719": "T1562",
            "4720": "T1136",
            "4722": "T1136",
            "4724": "T1003",
            "4728": "T1098",
            "4732": "T1098",
            "4740": "T1110",
            "4756": "T1098",
            "4776": "T1003",
            "5140": "T1021",
            "5145": "T1021",
            "5156": "T1041",
            "5157": "T1041",
            "7045": "T1543",
        }

        mapped = []
        seen_techniques = set()

        for event in events:
            event_id = event.get("event_id", "")
            technique_id = event_to_technique.get(event_id)
            if technique_id and technique_id not in seen_techniques:
                technique = cls.TECHNIQUES.get(technique_id)
                if technique:
                    mapped.append({
                        "technique_id": technique_id,
                        "technique_name": technique["name"],
                        "tactic_id": technique["tactic"],
                        "tactic_name": cls.TACTICS.get(technique["tactic"], "Unknown"),
                        "description": technique["description"],
                        "evidence_count": sum(1 for e in events if e.get("event_id") == event_id),
                    })
                    seen_techniques.add(technique_id)

        return mapped

    @classmethod
    def get_all_techniques(cls) -> List[Dict]:
        return [
            {"technique_id": k, **v}
            for k, v in cls.TECHNIQUES.items()
        ]

    @classmethod
    def get_all_tactics(cls) -> List[Dict]:
        return [{"tactic_id": k, "name": v} for k, v in cls.TACTICS.items()]
