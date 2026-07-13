# CyberLens Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Browser SPA  │  │  Mobile App    │  │  API Client  │  │
│  └───────┬────────┘  └────────────────┘  └──────┬───────┘  │
└──────────┼──────────────────────────────────────┼──────────┘
           │                                      │
┌──────────▼──────────────────────────────────────▼──────────┐
│                    HTTPS (443)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     NGINX                             │  │
│  │             Reverse Proxy / Load Balancer              │  │
│  │              Rate Limiting / SSL Termination           │  │
│  └──────────┬───────────────────────────────┬───────────┘  │
└─────────────┼───────────────────────────────┼──────────────┘
              │                               │
┌─────────────▼───────────┐     ┌─────────────▼───────────┐
│   Frontend (React SPA)  │     │   Backend (FastAPI)     │
│   Port 3000             │     │   Port 8000             │
│                         │     │                         │
│   - React 18            │     │   - Controllers         │
│   - TypeScript          │     │   - Services            │
│   - Tailwind CSS        │     │   - Repositories        │
│   - React Flow          │     │   - Models              │
│   - Framer Motion       │     │   - Schemas             │
│   - Recharts            │     │                         │
│   - Zustand             │     │   JWT Auth / RBAC       │
└─────────────────────────┘     └────────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
          ┌─────────▼──────────┐   ┌──────────▼──────────┐   ┌────────▼────────┐
          │   PostgreSQL 16    │   │     Neo4j 5         │   │  Ollama (LLM)   │
          │   Port 5432        │   │     Port 7687        │   │  Port 11434     │
          │                    │   │                      │   │                 │
          │   - Users          │   │   - Computers        │   │  - Local LLM    │
          │   - Projects       │   │   - Users            │   │  - No training  │
          │   - Uploads        │   │   - IPs              │   │  - Prompt-based │
          │   - Events         │   │   - Processes        │   │                 │
          │   - Investigations │   │   - Files            │   │                 │
          │   - Reports        │   │   - Relationships    │   │                 │
          │   - Chat History   │   │                      │   │                 │
          └───────────────────┘   └──────────────────────┘   └─────────────────┘
```

## Backend Architecture

### Layered Architecture (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Routes)                        │
│  auth / projects / uploads / events / timeline              │
│  dashboard / investigations / graph                         │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  AuthService / LogParserService / NormalizerService         │
│  CorrelationService / AIService / GraphService              │
│  MitreService / InvestigationService / ReportService        │
├─────────────────────────────────────────────────────────────┤
│                    Repository Layer                          │
│  BaseRepository<T> / UserRepository / ProjectRepository     │
│  UploadRepository / EventRepository / InvestigationRepo    │
│  ReportRepository                                           │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer (Models)                       │
│  User / Project / Upload / LogEntry / NormalizedEvent       │
│  Investigation / Report / Recommendation / ChatHistory      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Investigation Pipeline

```
Upload Logs → Parse → Normalize → Correlate → AI Analyze → Report
    │           │         │           │           │           │
    ▼           ▼         ▼           ▼           ▼           ▼
  Raw File   Raw Events  Unified    Sessions   LLM Prompt  Executive
               List      Schema     & Trees    & Response   Summary
```

### Key Design Decisions

1. **Repository Pattern**: Abstracts database access, enables unit testing with mocks
2. **Dependency Injection**: Services receive dependencies via constructor, decoupled from FastAPI
3. **Single Responsibility**: Each service class has one purpose
4. **Separation of Concerns**: Routes handle HTTP, services handle business logic, repositories handle data

## Frontend Architecture

### Component Hierarchy

```
App
├── BrowserRouter
│   ├── Landing (public)
│   ├── Login (public)
│   ├── Register (public)
│   └── ProtectedRoute
│       └── Layout
│           ├── Header (search, notifications, user menu)
│           ├── Sidebar (navigation)
│           └── <Outlet>
│               ├── Dashboard
│               ├── UploadLogs
│               ├── Timeline
│               ├── AttackGraph
│               ├── EvidenceViewer
│               ├── Investigation
│               ├── Chat
│               ├── Reports
│               ├── Settings
│               └── Profile
```

### State Management

- **Zustand** store for global state (user, token, projects, theme)
- **Local state** with useState/useReducer for page-specific data
- **API calls** centralized in `api.ts` service class with Axios interceptors

### Design System

- **Colors**: cyber-950 bg, neon-* accent colors
- **Components**: GlassCard, SeverityBadge, StatCard
- **Layout**: Responsive sidebar (collapsed/expanded), sticky header
- **Animations**: Framer Motion for page transitions and micro-interactions

## Security Architecture

```
┌─────────────┐
│  User Auth   │
│  JWT Token   │────▶ Access Token (60min) + Refresh Token (7d)
└─────────────┘
      │
      ▼
┌─────────────┐
│  RBAC Guard  │
│              │────▶ Admin: all operations
│              │────▶ Analyst: create/update resources
│              │────▶ Viewer: read-only
└─────────────┘
      │
      ▼
┌─────────────┐
│ Rate Limiter │────▶ 60 requests/min per IP (NGINX)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Input Valid  │────▶ Pydantic schemas validate all inputs
└─────────────┘
```

## AI Integration

```
┌─────────────────────────────────────┐
│         AIService                    │
│                                     │
│  investigate(events, context)       │
│  chat(question, investigation, hist)│
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Prompt Template Engine      │  │
│  │                               │  │
│  │   [System Prompt]             │  │
│  │   [Evidence Block]            │  │
│  │   [Context Block]             │  │
│  │   [Format Instructions]       │  │
│  └───────────────────────────────┘  │
│            │                        │
│            ▼                        │
│  ┌───────────────────────────────┐  │
│  │    LLM Backend Adapter        │  │
│  │                               │  │
│  │  local → Ollama API           │  │
│  │  remote → OpenAI Compatible   │  │
│  └───────────────────────────────┘  │
│            │                        │
│            ▼                        │
│  ┌───────────────────────────────┐  │
│  │    Response Parser            │  │
│  │    JSON extraction + fallback │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```
