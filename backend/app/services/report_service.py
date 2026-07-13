import json
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.investigation import Investigation
from app.models.report import Report
from app.repositories.report import ReportRepository


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.report_repo = ReportRepository(db)

    def generate_report(self, investigation: Investigation, user_id: int) -> Report:
        report = self.report_repo.create(
            investigation_id=investigation.id,
            project_id=investigation.project_id,
            user_id=user_id,
            title=f"Security Investigation Report - {investigation.title}",
            report_type="full",
            executive_summary=self._generate_executive_summary(investigation),
            technical_summary=self._generate_technical_summary(investigation),
            timeline=investigation.timeline,
            evidence=investigation.evidence,
            affected_systems=investigation.affected_systems,
            mitre_techniques=investigation.mitre_mapping,
            recommendations=investigation.recommendations,
        )
        return report

    def _generate_executive_summary(self, investigation: Investigation) -> str:
        attack_type = investigation.attack_type or "Unknown Attack Type"
        confidence = investigation.confidence_score or 0
        affected = investigation.affected_systems or []
        systems_count = len(affected)

        summary = (
            f"Executive Summary\n"
            f"=================\n\n"
            f"An investigation was conducted and identified the following:\n\n"
            f"Attack Classification: {attack_type}\n"
            f"Confidence Score: {confidence}%\n"
            f"Affected Systems: {systems_count}\n"
            f"Investigation Status: {investigation.status.title()}\n\n"
        )

        if investigation.summary:
            summary += f"Summary:\n{investigation.summary}\n\n"

        summary += (
            "Key Findings:\n"
            f"- The attack was classified as {attack_type}\n"
            f"- {systems_count} system(s) were affected\n"
            f"- {len(investigation.recommendations or [])} recommendation(s) have been generated\n\n"
            "Immediate Actions Required:\n"
        )

        recommendations = investigation.recommendations or []
        for rec in recommendations[:5]:
            if isinstance(rec, dict):
                summary += f"- [{rec.get('priority', 'medium').upper()}] {rec.get('title', '')}\n"

        return summary

    def _generate_technical_summary(self, investigation: Investigation) -> str:
        timeline = investigation.timeline or []
        evidence = investigation.evidence or []
        mitre = investigation.mitre_mapping or []

        summary = (
            f"Technical Summary\n"
            f"================\n\n"
            f"Timeline Events: {len(timeline)}\n"
            f"Evidence Items: {len(evidence)}\n"
            f"MITRE Techniques Identified: {len(mitre)}\n\n"
        )

        if mitre:
            summary += "MITRE ATT&CK Mapping:\n"
            for technique in mitre:
                if isinstance(technique, dict):
                    summary += (
                        f"- {technique.get('technique_id', 'N/A')}: "
                        f"{technique.get('technique_name', 'N/A')} "
                        f"({technique.get('tactic_name', 'N/A')})\n"
                    )
            summary += "\n"

        if timeline:
            summary += "Critical Timeline Events:\n"
            for event in timeline[:10]:
                if isinstance(event, dict):
                    summary += (
                        f"[{event.get('timestamp', 'N/A')}] "
                        f"{event.get('event', 'N/A')} - "
                        f"{event.get('computer', 'N/A')}\n"
                    )

        return summary

    def get_report(self, report_id: int) -> Optional[Report]:
        return self.report_repo.get_by_id(report_id)

    def get_reports_by_investigation(self, investigation_id: int) -> List[Report]:
        return self.report_repo.get_by_investigation(investigation_id)

    def get_reports_by_project(self, project_id: int) -> List[Report]:
        return self.report_repo.get_by_project(project_id)
