#!/bin/bash
set -euo pipefail

# CyberLens Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

ENV="${1:-production}"
COMPOSE_FILE="docker-compose.yml"
PROJECT="cyberlens"

echo "=== CyberLens Deployment (${ENV}) ==="

if [ "${ENV}" = "production" ]; then
    export COMPOSE_FILE="docker-compose.yml"
    export JWT_SECRET_KEY=$(openssl rand -hex 32)
    echo "Generated JWT secret key"
fi

echo "Pulling latest images..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT}" pull

echo "Building services..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT}" build --pull

echo "Starting services..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT}" up -d --remove-orphans

echo "Waiting for services to be healthy..."
sleep 10

echo "Running database migrations..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT}" exec -T backend alembic upgrade head

echo "Seeding default data..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT}" exec -T backend python scripts/seed.py

echo "=== Deployment Complete ==="
echo "Frontend: https://localhost"
echo "API Docs: https://localhost/api/v1/docs"
echo "Neo4j Browser: http://localhost:7474"

echo ""
echo "Useful commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Restart:      docker compose restart"
echo "  Shell:        docker compose exec backend bash"
