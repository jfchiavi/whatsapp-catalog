# Comandos Docker — whatsapp-catalog

Compose siempre con `--env-file .env.docker` para cargar JWT y Postgres.

Contenedores: `catalog_postgres` · `catalog_backend` · `catalog_frontend`

---

## Reset completo

```bash
./reset-docker.sh
```
Baja servicios, opcionalmente borra el volumen de Postgres, rebuild, migraciones y seed. Login: `admin@demo.com` / `123456`.

---

## Levantar / bajar

```bash
docker-compose --env-file .env.docker up -d
```
Arranca los 3 servicios en background (sin rebuild).

```bash
docker-compose --env-file .env.docker up --build -d
```
Rebuild de imágenes y arranque.

```bash
docker-compose --env-file .env.docker down
```
Para y elimina contenedores. **No** borra el volumen de Postgres.

```bash
docker-compose --env-file .env.docker ps
```
Estado de los servicios.

---

## Logs

```bash
docker logs catalog_backend
```
Logs del API (Next.js / Prisma / errores 500).

```bash
docker logs -f catalog_backend
```
Logs en vivo (Ctrl+C para salir).

```bash
docker logs --tail 100 catalog_backend
```
Últimas 100 líneas.

```bash
docker logs catalog_frontend
```
Logs de nginx (SPA).

```bash
docker logs catalog_postgres
```
Logs de PostgreSQL.

```bash
docker-compose --env-file .env.docker logs -f
```
Logs de todos los servicios a la vez.

---

## Recrear un contenedor

```bash
docker-compose --env-file .env.docker up -d --force-recreate backend
```
Recrea solo el backend (útil si cambiaste env / JWT, sin rebuild).

```bash
docker-compose --env-file .env.docker up -d --force-recreate --build backend
```
Rebuild + recreate del backend.

```bash
docker-compose --env-file .env.docker up -d --force-recreate --build frontend
```
Rebuild + recreate del frontend (necesario si cambió `VITE_API_URL` o código Vite).

```bash
docker restart catalog_backend
```
Reinicia el proceso sin recrear el contenedor.

---

## Entrar a un contenedor

```bash
docker exec -it catalog_backend sh
```
Shell en el backend.

```bash
docker exec -it catalog_postgres psql -U devuser -d catalogdb
```
Cliente SQL de Postgres.

```bash
docker exec catalog_postgres psql -U devuser -d catalogdb -c 'SELECT id, email, role FROM "User";'
```
Consulta puntual (usuarios seed).

---

## Seed / migraciones

```bash
docker exec -i catalog_postgres psql -U devuser -d catalogdb -v ON_ERROR_STOP=1 < seed-docker.sql
```
Vuelve a sembrar datos (TRUNCATE + inserts). No borra el volumen.

```bash
docker exec -i catalog_postgres psql -U devuser -d catalogdb < backend/prisma/migrations/20260908120000_init/migration.sql
```
Aplica a mano la migración init (solo si la tabla aún no existe).

---

## Volúmenes

```bash
docker volume ls
```
Lista volúmenes.

```bash
docker-compose --env-file .env.docker down
docker volume rm whatsapp-catalog_postgres_data
```
Borra la base. El próximo `up` arranca Postgres vacío.

---

## Diagnóstico rápido

```bash
curl -i http://localhost:3000/api/auth/login
```
Debe responder el backend (método GET → 405 de Next es normal; POST es el login).

```bash
curl -i -X POST http://localhost:80/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"123456"}'
```
Login vía nginx (mismo path que el browser).

```bash
docker inspect catalog_backend --format '{{range .Config.Env}}{{println .}}{{end}}' | grep JWT
```
Verifica que el backend tenga `JWT_ACCESS_SECRET` (no vacío).
