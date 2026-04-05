## Naming Conventions

### Files & Folders

- **Folder structure:** `kebab-case` (e.g., `ingest-log`, `log-watcher`, `match-aggregate`)
- **File names:** `kebab-case` + descriptive suffix (e.g., `.service.ts`, `.controller.ts`, `.use-case.ts`, `.repository.ts`)
- **Class names:** `PascalCase` + suffix matching file pattern (e.g., `LogParserService`, `IngestLogUseCase`)
- **DTO files:** Pattern appears to be file name → class name (e.g., `ingest-log.dto.ts` → likely `IngestLogDto`)

### Modules

- Folder: `kebab-case` (e.g., `engine`, `analytics`, `shared`)
- File: `{ModuleName}.module.ts` → `export class {ModuleName}Module`
- Examples:
  - `engine/engine.module.ts` → `EngineModule`
  - `analytics/analytics.module.ts` → `AnalyticsModule`
  - `game.module.ts` → `GameModule`

### Layer Organization (within modules)

- `core/` - Pure domain logic
  - `service/` - Stateless business logic
  - `use-case/` - Orchestration of services (application layer)
  - `exception/` - Domain-specific exceptions
  - `model/` - Data models
  - `port/` - Port interfaces (hexagonal architecture)
- `http/` - HTTP binding layer
  - `controller/` - Request handlers
  - `dto/` - Data Transfer Objects
  - `filter/` - Exception filters
  - `interceptor/` - Request/response interceptors
- `persistence/` - Data access layer
  - `repository/` - Data access objects
  - `mapper/` - Entity ↔ DTO mapping
  - `entity/` - ORM entity definitions
- `infrastructure/` - External integrations (if needed)

### Code Style

**Imports:**
```typescript
// Absolute path aliases (from tsconfig.json)
import { LogParserService } from "@engine/core/service/log-parser.service";
import { MatchRepository } from "@shared/persistence/repository/match.repository";
import { AppLogger } from "@shared/logger/service/app-logger.service";

// NestJS & external
import { Injectable, Controller, Post } from "@nestjs/common";
import { Some third-party } from "package-name";
```

**Decorators:**
- Classes use `@Injectable()`, `@Controller()`, `@Module()`
- Methods use `@Post()`, `@Get()`, `@Param()`, `@Body()`, `@UseInterceptors()`

**Patterns:**
- Services are stateless and injectable
- Use cases orchestrate multiple services
- Controllers are thin (delegate to use cases)
- DTOs use class-validator decorators (e.g., `@IsString()`, `@IsNumber()`)

### Import Aliases (tsconfig.json paths)

```json
"@match-engine/*": "src/module/game/*"
"@engine/*": "src/module/game/engine/*"
"@analytics/*": "src/module/game/analytics/*"
"@shared/*": "src/module/shared/*"
"@src/*": "src/*"
```

---

## Testing Conventions

**Structure:**
```
src/module/*/test/
├── unit/
│   └── {name}.spec.ts
└── e2e/
    ├── {endpoint}.e2e.spec.ts
    ├── __snapshots__/
    └── resources/
```

**Test framework:** Vitest (multi-project config)
- `test/vitest.config.unit.ts` - Unit tests
- `test/vitest.config.e2e.ts` - End-to-end tests

**Examples observed:**
- `log-parser.service.spec.ts` - Unit test for LogParserService
- `match.model.spec.ts` - Unit test for Match model
- `analytics.e2e.spec.ts`, `ingest-log.e2e.spec.ts` - E2E tests
- `__snapshots__/` - Snapshot test artifacts

**Command:**
- `pnpm test` - All tests
- `pnpm test:unit` - Unit only
- `pnpm test:e2e` - E2E only
- `pnpm test:watch` - Watch mode
- `pnpm test:coverage` - Coverage report (output in `coverage/`)

---

## Code Quality Tools

### Biome (Formatting & Linting)

- **Config file:** `biome.json` (at root)
- **Commands:**
  - `pnpm format:check` - Check formatting
  - `pnpm format:fix` - Fix formatting + lint

### Build & Serve

- **Build:** `pnpm build` → `dist/` directory
- **Dev mode:** `pnpm start:dev` - NestJS watch mode
- **Debug mode:** `pnpm start:debug` - VS Code debugger
- **Production:** `pnpm start:prod` - Run from dist

---

## Git Workflow

- **Husky hooks enabled** (`prepare` script in package.json)
- Likely pre-commit hooks for formatting/linting
- Convention: Atomic commits (implied by spec-driven approach if adopted)

---

## Environment Configuration

- **.env.example** - Template (required before running)
- **.env** - Local config (copy from example)
- **DATABASE_HOST override:** Docker Compose auto-sets to `db` (see README)
- **Loaded via:** `@nestjs/config` + `ConfigService`

---

## Error Handling Conventions

**Pattern (inferred):**
- Domain exceptions in `engine/core/exception/`
- Custom exception classes extend standard NestJS HttpException or custom base
- Exceptions include context name for logging
- Global Validation Pipe (main.ts) handles DTO validation errors

---

## Code Organization Principles

1. **Separation of Concerns:** HTTP layer → Use Case → Service → Repository
2. **Dependency Injection:** All dependencies injected via NestJS container
3. **No circular dependencies:** Modules clearly import upward (shared modules are leaf nodes)
4. **Type Safety:** TypeScript strict mode enabled
5. **Validation:** Class-validator decorators on DTOs + business logic validation
6. **Logging:** Centralized via LoggerFactory with context names
7. **Testing:** Both unit (isolated) and e2e (integration) tests present

