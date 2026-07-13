# CyberLens

**AI-Powered Cyber Security Investigation Platform**

CyberLens is a production-grade security investigation platform that transforms raw security logs into AI-driven attack timelines. It combines log parsing, event correlation, MITRE ATT&CK mapping, Neo4j attack graphs, and LLM-powered analysis to help security teams understand cyber attacks with evidence-backed conclusions.

---

## Architecture

```
┌────────────┐     ┌──────────┐     ┌───────────┐
│  Frontend  │────▶│   NGINX  │────▶│  Backend  │
│  React/TS  │     │  Reverse │     │  FastAPI  │
│  Tailwind  │◀────│  Proxy   │◀────│  Python   │
└────────────┘     └──────────┘     └─────┬─────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
               ┌────▼────┐          ┌─────▼─────┐          ┌───▼───┐
               │PostgreSQL│          │   Neo4j   │          │Ollama │
               │  Events  │          │ Attack    │          │ Local │
               │  Users   │          │ Graph     │          │ LLM   │
               │  Reports │          │           │          │       │
               └─────────┘          └───────────┘          └───────┘
```

## Core Capabilities

| Module | Description |
|---|---|
| **Log Parser** | Parse EVTX, Sysmon, CSV, JSON, TXT, Apache, Firewall logs |
| **Event Normalizer** | Normalize all logs into unified schema |
| **Correlation Engine** | Group logs by session, process tree, attack patterns |
| **Timeline Builder** | Interactive zoomable timeline with severity colors |
| **AI Investigation** | LLM-powered analysis with evidence-backed conclusions |
| **Attack Graph** | Neo4j-based visual relationship mapping (React Flow) |
| **MITRE Mapper** | Automatic ATT&CK technique identification |
| **AI Chat** | Interactive investigation Q&A with source citation |
| **Report Generator** | Executive + technical PDF reports |

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- 8GB+ RAM recommended

### Run

```bash
# Clone and navigate
cd CyberLens

# Start all services
docker compose up -d

# Seed the local AI model
docker exec cyberlens-ollama ollama pull cyberlens

# Access
# Frontend: https://localhost
# API Docs: https://localhost/api/v1/docs
```

### Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Analyst | `analyst` | `analyst123` |
| Viewer | `viewer` | `viewer123` |

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API

Full API documentation at `/api/v1/docs` when running.

| Endpoint | Description |
|---|---|
| `/api/v1/auth/*` | Authentication (register, login, refresh) |
| `/api/v1/projects/*` | Project CRUD |
| `/api/v1/uploads/*` | File upload & parsing |
| `/api/v1/events/*` | Event queries & search |
| `/api/v1/timeline/*` | Timeline data |
| `/api/v1/dashboard/*` | Dashboard statistics |
| `/api/v1/investigations/*` | AI investigations & reports |
| `/api/v1/investigations/graph/*` | Attack graph data |

## Project Structure

```
CyberLens/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── main.py           # App entry point
│   ├── alembic/              # Database migrations
│   ├── tests/                # Test suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client
│   │   ├── store/            # Zustand state
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Tailwind CSS
│   └── package.json
├── database/
│   └── init.sql              # Schema & seed data
├── nginx/
│   └── nginx.conf            # Reverse proxy config
├── scripts/
│   ├── seed.py               # Sample data generator
│   └── deploy.sh             # Deployment script
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── ER_DIAGRAM.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TESTING_PLAN.md
│   └── DEPLOYMENT_GUIDE.md
├── docker-compose.yml
└── README.md
```

## Security

- **JWT** authentication with access/refresh tokens
- **RBAC** (Admin, Analyst, Viewer roles)
- **Rate limiting** on API endpoints
- **Password hashing** with bcrypt
- **HTTPS** ready with nginx
- **CORS** protection
- Input validation on all endpoints

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, React Flow, Framer Motion, Recharts, Zustand
- **Backend:** FastAPI, SQLAlchemy, Pydantic, JWT, Neo4j Driver
- **Database:** PostgreSQL 16, Neo4j 5
- **AI:** Ollama (local LLM), OpenAI-compatible APIs
- **Infrastructure:** Docker, Docker Compose, Nginx

## License

MIT
