import json
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

import httpx

from app.core.config import settings

INVESTIGATION_PROMPT = """You are a Digital Forensics Investigator AI. Analyze the following security log evidence and provide a detailed forensic report.

RULES:
- Analyze ONLY the supplied evidence. Never assume facts not in evidence.
- If there is insufficient evidence to support a conclusion, state "Insufficient Evidence" clearly.
- Every conclusion MUST reference specific Event IDs and timestamps from the evidence.
- Never hallucinate or fabricate evidence.
- Be precise about attacker entry points, lateral movement, and impact.

EVIDENCE:
{evidence}

INVESTIGATION CONTEXT:
{context}

Return your analysis as a JSON object with this exact structure:
{{
    "attack_type": "string - the primary attack type identified",
    "attack_score": "integer 0-100 - confidence in attack classification",
    "summary": "string - executive summary of what happened",
    "timeline": [
        {{
            "timestamp": "string",
            "event": "string",
            "computer": "string",
            "detail": "string",
            "severity": "critical|high|medium|low|info"
        }}
    ],
    "evidence_used": [
        {{
            "event_id": "string",
            "timestamp": "string",
            "detail": "string",
            "relevance": "string"
        }}
    ],
    "affected_systems": [
        {{
            "computer": "string",
            "role": "string",
            "findings": "string"
        }}
    ],
    "mitre_techniques": [
        {{
            "technique_id": "string (e.g., T1059)",
            "technique_name": "string",
            "description": "string",
            "evidence_ref": "string"
        }}
    ],
    "recommendations": [
        {{
            "priority": "critical|high|medium|low",
            "title": "string",
            "description": "string",
            "affected_systems": ["string"]
        }}
    ],
    "confidence_score": "integer 0-100",
    "insufficient_evidence": false
}}"""

CHAT_PROMPT = """You are a Digital Forensics Investigator AI assisting with a security investigation.

CONTEXT:
{context}

PREVIOUS ANALYSIS:
{analysis}

Conversation history:
{history}

User question: {question}

Rules:
- Answer ONLY based on the evidence provided.
- If the evidence does not contain the answer, say "Insufficient Evidence".
- Cite specific Event IDs, timestamps, and log sources.
- Be concise and precise.
- Provide a confidence score for your answer.

Return your answer as JSON:
{{
    "answer": "string",
    "confidence": "integer 0-100",
    "evidence": [
        {{
            "event_id": "string",
            "timestamp": "string",
            "detail": "string"
        }}
    ],
    "insufficient_evidence": false
}}"""


class AIService:
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.api_url = settings.LLM_API_URL
        self.api_key = settings.LLM_API_KEY

    async def investigate(self, events: List[Dict], context: Dict = None) -> Dict:
        formatted_events = self._format_events_for_prompt(events)
        context_str = json.dumps(context or {}, indent=2)

        prompt = INVESTIGATION_PROMPT.format(
            evidence=formatted_events,
            context=context_str,
        )

        result = await self._query_llm(prompt)
        parsed = self._parse_response(result)

        if parsed.get("attack_type") == "Analysis Pending" or not parsed.get("summary"):
            return self._generate_offline_analysis(events, context or {})

        return parsed

    async def chat(self, question: str, investigation: Dict, history: List[Dict] = None) -> Dict:
        formatted_history = self._format_history(history or [])
        formatted_analysis = json.dumps(investigation.get("analysis", {}), indent=2)
        formatted_context = json.dumps({
            "project_id": investigation.get("project_id"),
            "attack_type": investigation.get("attack_type"),
            "total_events": investigation.get("total_events", 0),
            "affected_systems": investigation.get("affected_systems", []),
        }, indent=2)

        prompt = CHAT_PROMPT.format(
            context=formatted_context,
            analysis=formatted_analysis[:3000],
            history=formatted_history,
            question=question,
        )

        result = await self._query_llm(prompt)
        return self._parse_chat_response(result)

    def _format_events_for_prompt(self, events: List[Dict]) -> str:
        sorted_events = sorted(events, key=lambda e: e.get("timestamp", ""))
        lines = []
        for e in sorted_events[:200]:
            lines.append(
                f"[{e.get('timestamp', 'N/A')}] "
                f"Computer: {e.get('computer_name', 'N/A')} | "
                f"User: {e.get('user_name', 'N/A')} | "
                f"EventID: {e.get('event_id', 'N/A')} | "
                f"Event: {e.get('event_name', 'N/A')} | "
                f"Process: {e.get('process_name', 'N/A')} | "
                f"IP: {e.get('ip_address', 'N/A')} | "
                f"CommandLine: {e.get('command_line', 'N/A')} | "
                f"Severity: {e.get('severity', 'N/A')}"
            )
        return "\n".join(lines)

    def _format_history(self, history: List[Dict]) -> str:
        lines = []
        for msg in history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            lines.append(f"{role}: {content}")
        return "\n".join(lines)

    async def _query_llm(self, prompt: str) -> str:
        try:
            if self.model == "local":
                return await self._query_local_llm(prompt)
            return await self._query_remote_llm(prompt)
        except Exception as e:
            return self._get_fallback_response(str(e))

    async def _query_local_llm(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self.api_url,
                json={
                    "model": "cyberlens",
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.1,
                },
            )
            if response.status_code == 200:
                return response.json().get("response", "")
            return self._get_fallback_response(f"LLM error: {response.status_code}")

    async def _query_remote_llm(self, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self.api_url,
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                },
                headers=headers,
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return self._get_fallback_response(f"LLM error: {response.status_code}")

    def _generate_offline_analysis(self, events: List[Dict], context: Dict) -> Dict:
        correlation = context.get("correlation", {})
        mitre_mapping = context.get("mitre_mapping", [])
        attack_patterns = correlation.get("attack_patterns", [])
        total = correlation.get("total_events", len(events))
        computers = correlation.get("unique_computers", 0)
        users = correlation.get("unique_users", 0)
        timeline_raw = correlation.get("timeline", [])

        attack_type = "Unknown"
        attack_score = 0
        if attack_patterns:
            sev_scores = {"critical": 90, "high": 70, "medium": 40, "low": 15}
            attack_type = attack_patterns[0].get("pattern", "Suspicious Activity")
            best = max(attack_patterns, key=lambda p: sev_scores.get(p.get("severity", "low"), 0))
            attack_score = sev_scores.get(best.get("severity", "medium"), 40)
            attack_type = best.get("pattern", attack_type)

        systems = list(set(e.get("computer_name", "") for e in events if e.get("computer_name")))

        timeline = []
        for t in timeline_raw[:100]:
            timeline.append({
                "timestamp": t.get("timestamp", ""),
                "event": t.get("event_name", ""),
                "computer": t.get("computer_name", ""),
                "detail": f"User: {t.get('user_name', 'N/A')} | IP: {t.get('ip_address', 'N/A')} | Severity: {t.get('severity', 'N/A')}",
                "severity": t.get("severity", "info") or "info",
            })

        evidence = []
        for e in events[:50]:
            evidence.append({
                "event_id": str(e.get("event_id", "")),
                "timestamp": str(e.get("timestamp", "")),
                "detail": f"{e.get('event_name', '')} on {e.get('computer_name', '')} by {e.get('user_name', '')}",
                "relevance": "correlated",
            })

        affected = []
        for comp in systems[:20]:
            sys_events = [e for e in events if e.get("computer_name") == comp]
            findings = f"{len(sys_events)} events detected"
            if attack_patterns:
                findings += f", patterns: {', '.join(p['pattern'] for p in attack_patterns)}"
            affected.append({
                "computer": comp,
                "role": "target",
                "findings": findings,
            })

        mitre_techniques = []
        for m in mitre_mapping[:20]:
            mitre_techniques.append({
                "technique_id": m.get("technique_id", ""),
                "technique_name": m.get("technique_name", ""),
                "description": m.get("description", ""),
                "evidence_ref": f"Event ID: {m.get('event_id', '')}",
            })

        recs = []
        for p in attack_patterns:
            recs.append({
                "priority": p.get("severity", "medium"),
                "title": f"Investigate {p.get('pattern', 'suspicious activity')}",
                "description": p.get("description", ""),
                "affected_systems": systems[:5],
            })
        if not recs:
            recs.append({
                "priority": "low",
                "title": "Review Events",
                "description": "Review the collected events for any signs of malicious activity.",
                "affected_systems": systems[:3] if systems else ["Unknown"],
            })

        summary_lines = []
        if attack_patterns:
            summary_lines.append(f"Detected {len(attack_patterns)} attack pattern(s):")
            for p in attack_patterns:
                summary_lines.append(f"  - {p['pattern']} ({p.get('severity', 'medium')} severity): {p['description']}")
        else:
            summary_lines.append("No specific attack patterns detected in the analyzed events.")
        summary_lines.append(f"Analyzed {total} events across {computers} system(s) and {users} user(s).")
        if mitre_mapping:
            summary_lines.append(f"Mapped to {len(mitre_mapping)} MITRE ATT&CK technique(s).")
        summary_lines.append("This is an offline analysis (no LLM available). Configure Ollama for deeper AI-powered insights.")

        return {
            "attack_type": attack_type or "Unknown",
            "attack_score": attack_score,
            "summary": "\n".join(summary_lines),
            "timeline": timeline,
            "evidence_used": evidence,
            "affected_systems": affected,
            "mitre_techniques": mitre_techniques,
            "recommendations": recs,
            "confidence_score": attack_score,
            "insufficient_evidence": len(events) == 0,
        }

    def _get_fallback_response(self, error: str) -> str:
        return json.dumps({
            "attack_type": "Analysis Pending",
            "attack_score": 0,
            "summary": f"AI analysis is currently unavailable. Please configure a local LLM (Ollama) or API key. Error: {error}",
            "timeline": [],
            "evidence_used": [],
            "affected_systems": [],
            "mitre_techniques": [],
            "recommendations": [{
                "priority": "high",
                "title": "Configure AI Model",
                "description": "Set up Ollama with a security-focused model or provide an API key for AI analysis.",
                "affected_systems": ["CyberLens Platform"],
            }],
            "confidence_score": 0,
            "insufficient_evidence": False,
        })

    def _parse_response(self, response: str) -> Dict:
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
            return json.loads(response)
        except (json.JSONDecodeError, ValueError):
            return {
                "attack_type": "Analysis Error",
                "attack_score": 0,
                "summary": "Could not parse AI response. Raw output available.",
                "timeline": [],
                "evidence_used": [],
                "affected_systems": [],
                "mitre_techniques": [],
                "recommendations": [],
                "confidence_score": 0,
                "insufficient_evidence": False,
                "raw_response": response,
            }

    def _parse_chat_response(self, response: str) -> Dict:
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
            return json.loads(response)
        except (json.JSONDecodeError, ValueError):
            return {
                "answer": response[:500] if response else "No response from AI.",
                "confidence": 0,
                "evidence": [],
                "insufficient_evidence": True,
            }
