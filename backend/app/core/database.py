import os
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or (
    f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

_connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    _connect_args["check_same_thread"] = False

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=_connect_args if _connect_args else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Neo4jConnection:
    def __init__(self):
        self._driver = None
        if settings.NEO4J_URI and settings.NEO4J_URI != "bolt://localhost:7687":
            try:
                from neo4j import GraphDatabase
                self._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
            except Exception:
                self._driver = None

    def get_driver(self):
        return self._driver

    def close(self):
        if self._driver:
            try:
                self._driver.close()
            except Exception:
                pass

    def create_session(self):
        if self._driver:
            return self._driver.session()
        return None


neo4j_conn = Neo4jConnection()


def get_neo4j():
    return neo4j_conn
