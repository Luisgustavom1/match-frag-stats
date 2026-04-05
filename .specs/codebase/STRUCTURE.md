## Directory Structure

```
.
├── .specs/                          # NEW: Specification & planning docs
│   └── codebase/                    # Brownfield mapping
├── coverage/                        # Vitest coverage reports (generated)
├── docs/
│   └── architecture.md              # High-level architecture notes
├── init-db/
│   └── initdb.sql                   # Database initialization script
├── src/
│   ├── app.module.ts                # Root NestJS module
│   ├── main.ts                      # Bootstrap entry point
│   └── module/
│       ├── game/                    # Main domain
│       │   ├── game.module.ts       # Domain orchestrator
│       │   ├── engine/              # Input layer (log ingestion)
│       │   │   ├── engine.module.ts
│       │   │   ├── core/
│       │   │   │   ├── service/
│       │   │   │   │   └── log-parser.service.ts
│       │   │   │   ├── use-case/
│       │   │   │   │   ├── ingest-log.use-case.ts
│       │   │   │   │   └── log-watcher.use-case.ts
│       │   │   │   ├── exception/   # Domain exceptions
│       │   │   │   ├── model/
│       │   │   │   └── port/        # Port interfaces (hexagonal)
│       │   │   ├── http/
│       │   │   │   ├── ingest-log.controller.ts
│       │   │   │   ├── log-watcher.controller.ts
│       │   │   │   ├── dto/
│       │   │   │   └── filter/
│       │   │   ├── infrastructure/
│       │   │   └── persistence/
│       │   │       └── match-aggregate.persistence.service.ts
│       │   │
│       │   ├── analytics/           # Output layer (ranking calculation)
│       │   │   ├── analytics.module.ts
│       │   │   ├── core/
│       │   │   │   ├── service/
│       │   │   │   │   ├── ranking-calculator.service.ts
│       │   │   │   │   └── winner-infos.service.ts
│       │   │   │   └── use-case/
│       │   │   │       └── rank-matches.use-case.ts
│       │   │   └── http/
│       │   │       ├── analytics.controller.ts
│       │   │       └── dto/
│       │   │
│       │   └── shared/              # Shared across game modules
│       │       ├── http/
│       │       │   └── health.controller.ts
│       │       └── persistence/     # Drizzle ORM setup
│       │           ├── match-engine.persistence.module.ts
│       │           ├── drizzle.config.ts
│       │           ├── entity/
│       │           │   ├── match.entity.ts
│       │           │   ├── player.entity.ts
│       │           │   ├── frags.entity.ts
│       │           │   ├── schema.ts
│       │           │   └── index.ts
│       │           ├── mapper/
│       │           ├── repository/
│       │           │   ├── match.repository.ts
│       │           │   ├── player.repository.ts
│       │           │   └── frags.repository.ts
│       │           └── migrations/
│       │
│       └── shared/                  # Cross-cutting concerns
│           ├── config/
│           │   ├── config.module.ts
│           │   ├── service/
│           │   │   └── config.service.ts
│           │   └── util/
│           │       ├── config.factory.ts
│           │       └── ...
│           ├── logger/
│           │   ├── logger.module.ts
│           │   ├── service/
│           │   │   └── app-logger.service.ts
│           │   ├── interceptor/
│           │   │   └── log-url.interceptor.ts
│           │   └── util/
│           │       └── logger.factory.ts
│           └── persistence/         # (Shared DB infrastructure placeholder)
│               └── drizzle/
│
├── test/                            # Test configuration & shared mocks
│   ├── test.setup.ts
│   ├── vitest.config.unit.ts
│   ├── vitest.config.e2e.ts
│   └── mocks/
│       └── logger.ts
│
├── src/module/game/test/            # Tests within game module
│   ├── e2e/
│   │   ├── analytics.e2e.spec.ts
│   │   ├── health.e2e.spec.ts
│   │   ├── ingest-log.e2e.spec.ts
│   │   ├── log-watcher.e2e.spec.ts
│   │   ├── __snapshots__/
│   │   └── resources/
│   └── unit/
│       ├── log-parser.service.spec.ts
│       └── match.model.spec.ts
│
├── biome.json                       # Formatter & linter config
├── docker-compose.yml               # DB + app orchestration
├── Dockerfile.dev                   # Development container image
├── nest-cli.json                    # NestJS CLI config
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                   # Dependency lock file
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Test runner config (root)
└── README.md                        # Project guide
```

---

## Key Location Reference

| What | Where |
|------|-------|
| Application entry point | `src/main.ts` |
| Root NestJS module | `src/app.module.ts` |
| Domain orchestrator | `src/module/game/game.module.ts` |
| Log parsing logic | `src/module/game/engine/core/service/log-parser.service.ts` |
| Ingest API | `src/module/game/engine/http/ingest-log.controller.ts` |
| Log watcher | `src/module/game/engine/core/use-case/log-watcher.use-case.ts` |
| Ranking algorithm | `src/module/game/analytics/core/service/ranking-calculator.service.ts` |
| Rankings API | `src/module/game/analytics/http/analytics.controller.ts` |
| Match entity | `src/module/game/shared/persistence/entity/match.entity.ts` |
| Match repository | `src/module/game/shared/persistence/repository/match.repository.ts` |
| Drizzle ORM config | `src/module/game/shared/persistence/drizzle.config.ts` |
| Database migrations | `src/module/game/shared/persistence/migrations/` |
| Logging | `src/module/shared/logger/` |
| Configuration | `src/module/shared/config/` |
| Unit tests | `src/module/game/test/unit/` |
| E2E tests | `src/module/game/test/e2e/` |
| Test config | `test/vitest.config.unit.ts`, `test/vitest.config.e2e.ts` |
| Environment config | `.env` (copy from `.env.example`) |

