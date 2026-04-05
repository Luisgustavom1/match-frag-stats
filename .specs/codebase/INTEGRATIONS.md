## External Dependencies

### Database

- **PostgreSQL 18** (Docker container)
- **Drizzle ORM** for query abstraction
- **drizzle-kit** for migrations

### File System

- **chokidar** (file system watcher)
  - For LogWatcher use-case (continuous monitoring)
  - Watches log files on server filesystem
  - Triggers incremental parsing on file changes

### Mail / Notifications

- **None detected** (no mail, SMS, or notification service in deps)

### Authentication / Authorization

- **@nestjs/jwt** installed but **not confirmed** as active
- **No role-based access control** detected in visible code
- **Health endpoint** and ingest endpoints appear public
- **TODO:** Verify if JWT is actually used or can be removed

### External Services

None detected in current stack.

---

## Integration Points (Risks)

| Integration | Type | Risk | Mitigation |
|---|---|---|---|
| PostgreSQL (Docker) | Database | Network, startup order | docker-compose, health check |
| Google GenAI | API | Latency, quota, auth | TBD (usage unconfirmed) |
| File System (chokidar) | Local I/O | File permissions, race conditions | Chokidar built-in debouncing |
| Multer (file upload) | HTTP | Large files, memory | Max file size config (TBD) |

---

## Known External Integrations

### 1. PostgreSQL + Drizzle ORM

**Connection:**
- Config via environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- Drizzle config: `src/module/game/shared/persistence/drizzle.config.ts`
- Migrations auto-applied on startup (see `game:db:migrate` command)

**Queries:**
- All data access goes through Repositories
- Type-safe query builder

**Migrations:**
```bash
pnpm game:db:generate  # Detect schema changes, generate SQL
pnpm game:db:migrate   # Run pending migrations
```

### 2. Winston Logger

**Integration:**
- Configured in `@nestjs logger.module.ts`
- Injected globally via `LoggerFactory`
- Outputs to console (no file appender detected)

**Usage Pattern:**
```typescript
const logger = LoggerFactory("ContextName");
logger.log("message");
logger.error("message", error);
```

### 3. File Watcher (chokidar)

**Integration:**
- Used in `LogWatcherUseCase`
- Monitors a file path on the server filesystem
- Triggers incremental parsing on file add/change

**Architecture:**
- One-time setup per watch request
- Long-lived connection (until explicit stop or error)
- No server-sent events (SSE) or WebSocket (likely polling-based or callback)

### 4. Multer (File Upload)

**Integration:**
- HTTP file upload handler for POST `/game/ingest/log`
- Extracts multipart file from request
- Buffer passed to `IngestLogUseCase`

**Config:**
- In-memory buffer (streaming if configured)
- Single file field: `log`

---

## Environment Configuration

**Loaded from:** `.env` file (set via `@nestjs/config`)

**Key Variables (inferred):**
- `DATABASE_HOST` → Default to `localhost`, overridden to `db` in Docker
- `DATABASE_PORT` → PostgreSQL port (default 5432)
- `DATABASE_USER` → Auth credentials
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `NODE_ENV` → `development`, `production`, etc.
- `PORT` → Application port (assumed 3000)
- Possibly Google GenAI credentials (API_KEY?)

**Example (from README):**
```bash
cp .env.example .env
# Edit .env with local values if needed
```

---

## CI/CD Pipeline (Inferred)

**No CI/CD config file detected** in root (no .github/workflows, .gitlab-ci.yml, etc.)

**Likely local/manual flow:**
- `pnpm format:check` → Verify code style
- `pnpm test` → Run all tests
- `pnpm build` → Compile TypeScript
- Deploy dist/ to production

**Recommendation:** Create `.github/workflows/ci.yml` if Git-hosted

---

## Observability & Monitoring

**Logging:**
- Winston via @nestjs logger
- Context-tagged logs (service name, request ID?)
- **No metrics/tracing detected** (no Prometheus, Jaeger, etc.)
- **No centralized logging** (console output only)

**Health Check:**
- GET `/health` endpoint (HealthController)
- Returns basic status (likely 200 OK)

**Recommendation:** Add structured logging (JSON), metrics, and distributed tracing for production

