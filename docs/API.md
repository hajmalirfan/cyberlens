# CyberLens API Documentation

Base URL: `https://localhost/api/v1`

## Authentication

All API endpoints (except `/auth/*`) require a Bearer JWT token.

### POST /auth/register

Create a new user account.

```json
{
  "email": "user@company.com",
  "username": "analyst1",
  "password": "securepass123",
  "full_name": "Security Analyst"
}
```

Response:
```json
{
  "user": { "id": 1, "email": "...", "username": "analyst1", "role": "analyst" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /auth/login

Authenticate and receive tokens.

```json
{ "username": "analyst1", "password": "securepass123" }
```

Response: Same as register.

### GET /auth/me

Returns current user profile.

### PUT /auth/me

Update current user profile.

## Projects

### GET /projects

List user's projects.

### POST /projects

Create a new project.

```json
{ "name": "Incident #2024-001", "description": "Ransomware investigation" }
```

### GET /projects/:id

Get project details.

### PUT /projects/:id

Update project.

### DELETE /projects/:id

Delete project (admin only).

## Uploads

### POST /uploads/:project_id

Upload a log file. Multipart form data with `file` field.

### POST /uploads/:upload_id/parse

Parse an uploaded file. Triggers parsing + normalization pipeline.

### GET /uploads/:project_id/list

List all uploads for a project.

## Events

### GET /events/:project_id

List normalized events with pagination.

Query params: `page`, `page_size`, `severity`

### GET /events/:project_id/search

Search events. Query param: `q`

### GET /events/:project_id/stats

Get severity statistics.

## Timeline

### GET /timeline/:project_id

Get timeline data.

Query params: `start_time`, `end_time`, `severity`, `computer`, `search`

## Dashboard

### GET /dashboard/:project_id

Get dashboard statistics and recent activity.

## Investigations

### POST /investigations

Create a new investigation.

```json
{ "project_id": 1, "title": "Ransomware Analysis" }
```

### POST /investigations/:id/run

Execute AI investigation. Runs correlation engine, MITRE mapping, and LLM analysis.

### GET /investigations/:id

Get investigation results.

### GET /investigations/project/:project_id

List investigations for a project.

### POST /investigations/:id/chat

Interactive Q&A about an investigation.

```json
{ "investigation_id": 1, "message": "How did the attacker enter?" }
```

Response:
```json
{
  "response": "Based on EventID 4624 and 4688, the attacker gained initial access through compromised credentials for user j.smith, then executed PowerShell to download a C2 payload.",
  "confidence": 94,
  "evidence": [
    { "event_id": "4624", "timestamp": "2024-01-15T10:00:00Z", "detail": "Logon by j.smith from 10.0.1.50" },
    { "event_id": "4688", "timestamp": "2024-01-15T10:00:20Z", "detail": "PowerShell execution with encoded command" }
  ]
}
```

### POST /investigations/:id/report

Generate a formal report from an investigation.

### GET /investigations/:id/reports

List generated reports.

### GET /investigations/graph/:project_id

Get attack graph nodes and edges (Neo4j data).

### GET /investigations/graph/:project_id/paths

Get all attack paths.

## Error Responses

### 400 Bad Request
```json
{ "detail": "Validation error message" }
```

### 401 Unauthorized
```json
{ "detail": "Invalid authentication credentials" }
```

### 403 Forbidden
```json
{ "detail": "Role 'viewer' not authorized. Required: ['admin', 'analyst']" }
```

### 404 Not Found
```json
{ "detail": "Resource not found" }
```

### 429 Too Many Requests
```json
{ "detail": "Rate limit exceeded" }
```
