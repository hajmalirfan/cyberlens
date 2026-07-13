"""Standalone config for running CyberLens without Docker/PostgreSQL."""

from app.core.config import settings

# Override to use SQLite for local development
settings.DATABASE_URL = "sqlite:///./cyberlens_dev.db"
settings.NEO4J_URI = None
settings.BACKEND_CORS_ORIGINS = ["*"]
