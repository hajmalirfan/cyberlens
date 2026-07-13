from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.investigation import Investigation
from app.models.normalized_event import NormalizedEvent
from app.repositories.event import EventRepository
from app.repositories.investigation import InvestigationRepository
from app.services.ai_service import AIService
from app.services.correlation_service import CorrelationService
from app.services.graph_service import GraphService
from app.services.mitre_service import MitreService
from app.services.report_service import ReportService


class InvestigationService:
    def __init__(self, db: Session, neo4j=None):
        self.db = db
        self.investigation_repo = InvestigationRepository(db)
        self.event_repo = EventRepository(db)
        self.correlation_service = CorrelationService()
        self.ai_service = AIService()
        self.mitre_service = MitreService()
        self.report_service = ReportService(db)
        self.graph_service = GraphService(neo4j) if neo4j else None

    async def create_investigation(self, project_id: int, user_id: int, title: str) -> Investigation:
        investigation = self.investigation_repo.create(
            project_id=project_id,
            user_id=user_id,
            title=title,
            status="in_progress",
            started_at=datetime.utcnow(),
        )
        return investigation

    async def run_investigation(self, investigation_id: int) -> Investigation:
        investigation = self.investigation_repo.get_by_id(investigation_id)
        if not investigation:
            raise ValueError("Investigation not found")

        events = self.event_repo.get_by_project(investigation.project_id, limit=5000)
        event_dicts = [
            {
                "id": e.id,
                "event_id": e.event_id,
                "event_name": e.event_name,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "computer_name": e.computer_name,
                "user_name": e.user_name,
                "ip_address": e.ip_address,
                "process_name": e.process_name,
                "process_id": e.process_id,
                "parent_process": e.parent_process,
                "command_line": e.command_line,
                "file_path": e.file_path,
                "severity": e.severity,
                "source_type": e.source_type,
            }
            for e in events
        ]

        correlation_data = self.correlation_service.correlate(events)
        attack_patterns = correlation_data.get("attack_patterns", [])

        mitre_mapping = self.mitre_service.map_events_to_mitre(event_dicts)

        ai_analysis = await self.ai_service.investigate(event_dicts, {
            "correlation": correlation_data,
            "mitre_mapping": mitre_mapping,
            "attack_patterns": attack_patterns,
        })

        self.investigation_repo.update(
            investigation_id,
            status="completed",
            completed_at=datetime.utcnow(),
            attack_type=ai_analysis.get("attack_type", "Unknown"),
            attack_score=ai_analysis.get("attack_score", 0),
            summary=ai_analysis.get("summary", ""),
            timeline=ai_analysis.get("timeline", correlation_data.get("timeline", [])),
            evidence=ai_analysis.get("evidence_used", []),
            affected_systems=ai_analysis.get("affected_systems", []),
            mitre_mapping=mitre_mapping,
            recommendations=ai_analysis.get("recommendations", []),
            confidence_score=ai_analysis.get("confidence_score", 0),
            raw_llm_response=ai_analysis,
        )

        if self.graph_service:
            self.graph_service.build_graph(investigation.project_id, event_dicts)

        return self.investigation_repo.get_by_id(investigation_id)

    def get_investigation(self, investigation_id: int) -> Optional[Investigation]:
        return self.investigation_repo.get_by_id(investigation_id)

    def list_investigations(self, project_id: int) -> List[Investigation]:
        return self.investigation_repo.get_by_project(project_id)

    async def chat_with_ai(self, investigation_id: int, message: str, history: List[Dict] = None) -> Dict:
        investigation = self.investigation_repo.get_by_id(investigation_id)
        if not investigation:
            raise ValueError("Investigation not found")

        events = self.event_repo.get_by_project(investigation.project_id, limit=100)

        investigation_context = {
            "project_id": investigation.project_id,
            "investigation_id": investigation_id,
            "attack_type": investigation.attack_type,
            "attack_score": investigation.attack_score,
            "total_events": len(events),
            "affected_systems": investigation.affected_systems,
            "analysis": {
                "summary": investigation.summary,
                "timeline": investigation.timeline,
                "evidence": investigation.evidence,
                "recommendations": investigation.recommendations,
            },
        }

        return await self.ai_service.chat(message, investigation_context, history)
