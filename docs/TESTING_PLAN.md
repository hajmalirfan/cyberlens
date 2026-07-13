# CyberLens Testing Plan

## Testing Strategy

### Levels
1. **Unit Tests** - Individual functions and classes
2. **Integration Tests** - Service + database interaction
3. **API Tests** - HTTP endpoint behavior
4. **E2E Tests** - Full user workflows
5. **Performance Tests** - Load and stress testing

## Backend Tests (pytest)

### Directory Structure

```
backend/tests/
├── conftest.py              # Fixtures (db, client, auth)
├── test_auth.py             # Registration, login, token refresh
├── test_projects.py         # CRUD operations
├── test_uploads.py          # File upload & parsing
├── test_events.py           # Event queries, search, stats
├── test_timeline.py         # Timeline data
├── test_dashboard.py        # Dashboard stats
├── test_investigations.py   # Investigation pipeline
├── test_correlation.py      # Correlation engine
├── test_normalizer.py       # Event normalization
├── test_log_parser.py       # Log parsing (all formats)
├── test_ai_service.py       # LLM integration (mocked)
├── test_graph_service.py    # Neo4j operations
├── test_mitre_service.py    # MITRE mapping
├── test_report_service.py   # Report generation
└── fixtures/
    ├── sample_evtx.xml      # Sample EVTX data
    ├── sample_sysmon.xml    # Sample Sysmon data
    ├── sample_apache.log    # Sample Apache log
    └── sample_firewall.log  # Sample firewall log
```

### Test Categories

#### Unit Tests
```python
# Example: Log Parser
def test_parse_evtx():
    parser = LogParserService()
    with open("tests/fixtures/sample_evtx.xml") as f:
        events = parser.parse(f.read(), "evtx")
    assert len(events) > 0
    assert events[0]["event_id"] == "4624"

# Example: Normalizer
def test_normalize_windows_event():
    normalizer = NormalizerService()
    raw = {"event_id": "4688", "timestamp": "2024-01-15T10:00:00Z", "computer": "PC-01"}
    result = normalizer.normalize([raw], 1, 1)
    assert result[0]["event_name"] == "Process Created"
    assert result[0]["severity"] == "info"

# Example: Correlation
def test_brute_force_detection():
    correlation = CorrelationService()
    events = [NormalizedEvent(event_id="4625") for _ in range(10)]
    patterns = correlation._detect_attack_patterns(events)
    assert any(p["pattern"] == "Brute Force Attack" for p in patterns)

# Example: MITRE Mapping
def test_mitre_mapping():
    events = [{"event_id": "4624"}, {"event_id": "4688"}]
    mapped = MitreService.map_events_to_mitre(events)
    technique_ids = [m["technique_id"] for m in mapped]
    assert "T1078" in technique_ids  # Valid Accounts
    assert "T1059" in technique_ids  # Command and Scripting Interpreter
```

#### Integration Tests

```python
# Example: Investigation Pipeline
async def test_full_investigation(db_session, test_project, test_events):
    service = InvestigationService(db_session)
    inv = await service.create_investigation(test_project.id, 1, "Test")
    result = await service.run_investigation(inv.id)
    assert result.status == "completed"
    assert result.attack_type is not None
    assert result.confidence_score > 0
    assert len(result.recommendations) > 0
```

#### API Tests

```python
# Example: Authentication Flow
def test_auth_flow(test_client):
    # Register
    resp = test_client.post("/api/v1/auth/register", json={
        "email": "test@test.com", "username": "tester",
        "password": "testpass123"
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    # Login
    resp = test_client.post("/api/v1/auth/login", json={
        "username": "tester", "password": "testpass123"
    })
    assert resp.status_code == 200

    # Access protected endpoint
    resp = test_client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert resp.status_code == 200
```

## Frontend Tests (Vitest + Testing Library)

### Directory Structure

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── GlassCard.test.tsx
│   │   ├── SeverityBadge.test.tsx
│   │   ├── StatCard.test.tsx
│   │   └── Layout.test.tsx
│   ├── pages/
│   │   ├── Login.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── Timeline.test.tsx
│   │   └── AttackGraph.test.tsx
│   └── services/
│       └── api.test.ts
└── setup.ts
```

### Test Examples

```typescript
// Component test
describe('SeverityBadge', () => {
  it('renders critical severity correctly', () => {
    render(<SeverityBadge severity="critical" />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toHaveClass('severity-critical')
  })
})

// Hook test
describe('useStore', () => {
  it('persists user to localStorage', () => {
    const { result } = renderHook(() => useStore())
    act(() => { result.current.setUser(mockUser) })
    expect(localStorage.getItem('cyberlens_user')).toBeTruthy()
  })
})
```

## E2E Tests (Playwright/Cypress)

### Test Scenarios

1. **User Registration & Login Flow**
   - Register new user → redirected to dashboard
   - Login with credentials → see dashboard
   - Invalid credentials → error message

2. **Log Upload & Investigation Flow**
   - Create project → Upload EVTX file → File parsed
   - Navigate to dashboard → see event statistics
   - Run AI investigation → see attack type, score, recommendations
   - View attack graph → nodes and edges displayed

3. **Chat & Reporting Flow**
   - Open investigation chat → ask question → get AI response
   - Generate report → see report in reports list

## Performance Tests

### Backend

```bash
# Load test with locust
locust -f tests/load/locustfile.py --host http://localhost:8000

# API benchmark with wrk
wrk -t12 -c100 -d30s http://localhost:8000/api/v1/health
```

### Database

```sql
-- Query performance
EXPLAIN ANALYZE SELECT * FROM normalized_events
WHERE project_id = 1 AND timestamp > '2024-01-01'
ORDER BY timestamp DESC LIMIT 100;
```

## Coverage Goals

| Layer | Target |
|---|---|
| Backend Unit Tests | 90%+ |
| Backend Integration | 80%+ |
| Frontend Unit Tests | 80%+ |
| E2E Critical Paths | 100% |

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: test }
      neo4j:
        image: neo4j:5-community
        env: { NEO4J_AUTH: neo4j/test }
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/tests/ --cov=backend/app
      - run: npm ci && npm test --prefix frontend
```
