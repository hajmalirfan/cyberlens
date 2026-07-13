from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLens"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-Powered Cyber Security Investigation Platform"
    API_V1_STR: str = "/api/v1"

    POSTGRES_USER: str = "cyberlens"
    POSTGRES_PASSWORD: str = "cyberlens_secret_2024"
    POSTGRES_DB: str = "cyberlens"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: str = "5432"

    DATABASE_URL: Optional[str] = None

    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "cyberlens_neo4j_2024"

    JWT_SECRET_KEY: str = "cyberlens_jwt_secret_key_change_in_production_2024"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024
    UPLOAD_DIR: str = "/tmp/cyberlens_uploads"

    LLM_MODEL: str = "local"
    LLM_API_URL: str = "http://localhost:11434/api/generate"
    LLM_API_KEY: str = ""

    RATE_LIMIT_PER_MINUTE: int = 60

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
