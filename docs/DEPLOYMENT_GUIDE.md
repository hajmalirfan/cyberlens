# CyberLens Deployment Guide

## Prerequisites

- **Docker** 24+ and **Docker Compose** v2+
- **8GB+ RAM** (16GB recommended for production)
- **20GB+ disk space**
- **Linux** (Ubuntu 22.04+/Debian 12+ recommended)
- Domain name + SSL certificate (production)

---

## Quick Deployment (Development)

```bash
# Clone and deploy
git clone <repo-url> CyberLens
cd CyberLens
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Pull and configure local AI model
docker exec cyberlens-ollama ollama pull cyberlens
```

Access at `https://localhost`

---

## Production Deployment

### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify
docker --version && docker compose version
```

### 2. Configure Environment

```bash
cd CyberLens

# Generate secure secrets
export JWT_SECRET_KEY=$(openssl rand -hex 32)
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export NEO4J_PASSWORD=$(openssl rand -hex 16)

# Create .env
cat > .env << EOF
JWT_SECRET_KEY=${JWT_SECRET_KEY}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
NEO4J_PASSWORD=${NEO4J_PASSWORD}
LLM_MODEL=local
LLM_API_URL=http://ollama:11434/api/generate
EOF
```

### 3. SSL Certificates

```bash
# Option A: Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cyberlens.yourcompany.com

# Option B: Self-signed (internal)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/cyberlens.key \
  -out nginx/ssl/cyberlens.crt \
  -subj "/C=US/ST=State/L=City/O=CyberLens/CN=localhost"
```

### 4. Deploy

```bash
# Build and start
docker compose -f docker-compose.yml -p cyberlens up -d --build

# Run database migrations
docker compose -p cyberlens exec -T backend alembic upgrade head

# Seed demo data
docker compose -p cyberlens exec -T backend python scripts/seed.py

# Pull AI model
docker exec cyberlens-ollama ollama pull cyberlens

# Verify
docker compose -p cyberlens ps
curl -k https://localhost/health
```

### 5. Production Docker Compose

For production, use a hardened override:

```yaml
# docker-compose.override.yml
services:
  backend:
    environment:
      - LOG_LEVEL=WARNING
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G

  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
    volumes:
      - /data/cyberlens/postgres:/var/lib/postgresql/data

  neo4j:
    deploy:
      resources:
        limits:
          memory: 4G
    volumes:
      - /data/cyberlens/neo4j:/data

  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

## Monitoring & Maintenance

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f nginx
```

### Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/cyberlens"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p ${BACKUP_DIR}

# PostgreSQL
docker exec cyberlens-postgres pg_dump -U cyberlens cyberlens \
  | gzip > ${BACKUP_DIR}/postgres_${DATE}.sql.gz

# Neo4j
docker exec cyberlens-neo4j neo4j-admin database dump neo4j \
  --to-path=/backups
docker cp cyberlens-neo4j:/backups/neo4j.dump ${BACKUP_DIR}/neo4j_${DATE}.dump

# Uploads
tar czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz -C $(docker volume inspect cyberlens_backend_uploads --format '{{.Mountpoint}}') .

# Clean old backups (keep 30 days)
find ${BACKUP_DIR} -type f -mtime +30 -delete
```

### Restore

```bash
# PostgreSQL
gunzip -c backups/postgres_20240101_120000.sql.gz | \
  docker exec -i cyberlens-postgres psql -U cyberlens cyberlens

# Uploads
tar xzf backups/uploads_20240101_120000.tar.gz -C /tmp/uploads_restore
docker cp /tmp/uploads_restore/. cyberlens-backend:/app/uploads/
```

### Updates

```bash
# Pull latest
git pull origin main

# Rebuild and restart
docker compose -p cyberlens build --pull
docker compose -p cyberlens up -d

# Run new migrations
docker compose -p cyberlens exec -T backend alembic upgrade head
```

---

## Scaling

### Horizontal Scaling (Backend)

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
    networks:
      - cyberlens-net
```

Add a load balancer in nginx:

```nginx
upstream backend {
    least_conn;
    server backend:8000;
    server backend:8001;
    server backend:8002;
}
```

### Database Optimization

```sql
-- Ensure indexes are used
ANALYZE;

-- Tune PostgreSQL
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET random_page_cost = 1.1;
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| PostgreSQL won't start | Check `docker compose logs postgres`, verify volume permissions |
| Neo4j connection refused | Ensure NEO4J_AUTH is set correctly, check healthcheck |
| AI responses empty | Verify Ollama is running: `docker compose logs ollama` |
| File upload fails | Check `docker compose exec backend ls /app/uploads` permissions |
| Frontend blank page | Run `docker compose logs frontend`, check for build errors |
| 502 Bad Gateway | Ensure backend is running: `docker compose ps` |
| Rate limiting | Adjust `limit_req_zone` in nginx config |
| SSL errors | Verify certificates exist at `nginx/ssl/` |
