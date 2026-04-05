## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | NestJS | ^10.0.0 |
| **Language** | TypeScript | 5 |
| **Runtime** | Node.js | 20+ |
| **Database** | PostgreSQL | 18 (Docker) |
| **ORM** | Drizzle ORM | ^0.45.1 |
| **Migrations** | drizzle-kit | Latest |
| **Testing** | Vitest | Latest (multi-project: unit, e2e) |
| **Linting & Format** | Biome | Latest |
| **Logging** | Winston | nest-winston ^1.10.2 |
| **File Upload** | Multer | ^2.0.2 |
| **GraphQL** (unused) | Apollo Server + @nestjs/graphql | ^4.11.0, ^12.2.0 |
| **Config** | @nestjs/config | ^3.2.2 |
| **Validation** | class-validator + class-transformer | ^0.14.1, ^0.5.1 |
| **Utilities** | date-fns, decimal.js, chokidar | ^4.1.0, ^10.6.0, ^5.0.0 |

## Key Dependencies

- **@nestjs/platform-express** - HTTP server
- **chokidar** - File system watcher (used by LogWatcher)
- **decimal.js** - Precise decimal arithmetic (stats/ranking calculations)

## Database

- **PostgreSQL 18** via Docker
- **Drizzle ORM** for type-safe queries
- **Config location:** `src/module/game/shared/persistence/drizzle.config.ts`
- **Migrations location:** `src/module/game/shared/persistence/migrations/`
- **Commands:**
  - `pnpm game:db:generate` - Generate migrations
  - `pnpm game:db:migrate` - Run migrations

## Dev Environment

- **Docker Compose** - Database + application orchestration
- **Husky** - Git hooks (prepare script)
- **Biome** - Fast linter & formatter
- **pnpm** - Package manager (lock file: pnpm-lock.yaml)

## Build & Execution

- **Target ES2020** with CommonJS module output
- **Source maps enabled** for debugging
- **Incremental compilation enabled**
- **Output:** `./dist/` directory
- **Entry point:** `src/main.ts` → `app.listen(3000)`
