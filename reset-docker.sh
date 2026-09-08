#!/bin/bash
# Reset Docker environment for whatsapp-catalog
# Usage: ./reset-docker.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DB_NAME="${POSTGRES_DB:-catalogdb}"
DB_USER="${POSTGRES_USER:-devuser}"

echo -e "${YELLOW}Reset Docker environment${NC}"
echo -e "${YELLOW}=========================${NC}"

COMPOSE="docker-compose --env-file .env.docker"

# 1. Stop containers
echo -e "${YELLOW}Stopping containers...${NC}"
$COMPOSE down

# 2. Ask about volumes
read -p "Delete PostgreSQL volume? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Removing PostgreSQL volume...${NC}"
    docker volume rm whatsapp-catalog_postgres_data 2>/dev/null || true
    docker volume rm catalog_postgres 2>/dev/null || true
    sleep 1
    REMAINING=$(docker volume ls -q | grep -E "(whatsapp-catalog_postgres_data|catalog_postgres)" || true)
    if [ -n "$REMAINING" ]; then
        echo -e "${RED}WARNING: Volume still exists. Manual cleanup required:${NC}"
        echo "  docker volume rm $REMAINING"
        echo -e "${RED}Aborting to avoid data corruption.${NC}"
        exit 1
    fi
    FRESH_DB=true
else
    FRESH_DB=false
fi

# 3. Build images
echo -e "${YELLOW}Building images...${NC}"
$COMPOSE up --build -d

# 4. Wait for postgres
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
for i in $(seq 1 30); do
    if docker exec catalog_postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}PostgreSQL did not start in time${NC}"
        exit 1
    fi
    sleep 1
done

sleep 2

# 5. Create _prisma_migrations tracking table
echo -e "${YELLOW}Setting up migrations table...${NC}"
docker exec catalog_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
CREATE TABLE IF NOT EXISTS \"_prisma_migrations\" (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    logs TEXT,
    rolled_back_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
" 2>/dev/null || true

# 6. Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
for migration in backend/prisma/migrations/*/migration.sql; do
    [ -f "$migration" ] || continue
    migration_name=$(basename "$(dirname "$migration")")

    applied=$(docker exec catalog_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name='$migration_name';
    " 2>/dev/null | tr -d ' ' | xargs)

    if [ "$applied" = "1" ]; then
        echo "  Skipping $migration_name (already applied)"
        continue
    fi

    echo "  Applying $migration_name..."
    docker exec -i catalog_postgres psql -U "$DB_USER" -d "$DB_NAME" < "$migration" 2>/dev/null || true

    docker exec catalog_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO \"_prisma_migrations\" (migration_name, logs, started_at, finished_at)
        VALUES ('$migration_name', '', NOW(), NOW())
        ON CONFLICT (migration_name) DO NOTHING;
    " 2>/dev/null || true
done

# 7. Seed data
seed_db() {
    docker exec -i catalog_postgres psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < seed-docker.sql
}

if [ "$FRESH_DB" = true ]; then
    echo -e "${YELLOW}Fresh DB detected — seeding...${NC}"
    seed_db
else
    read -p "Reseed database with mock data? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Seeding database...${NC}"
        seed_db
    fi
fi

# 8. Wait for backend
echo -e "${YELLOW}Waiting for backend...${NC}"
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}Backend ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend did not start in time${NC}"
        docker logs catalog_backend 2>&1 | tail -10
    fi
    sleep 1
done

echo -e "${GREEN}Done!${NC}"
echo -e "Frontend: http://localhost:80"
echo -e "Backend:  http://localhost:3000"
echo -e "Postgres: localhost:5432 (devuser/dev20141201)"
echo -e "Login:    admin@demo.com / 123456"
