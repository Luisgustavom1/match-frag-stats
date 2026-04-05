## Architecture Overview

**Pattern:** Monolithic modular NestJS with Clean Architecture principles within the game domain.

```
src/
├── module/
│   ├── game/                    # Domain domain (main business logic)
│   │   ├── engine/              # Log ingestion & parsing (input layer)
│   │   ├── analytics/           # Ranking calculation & analysis (output layer)
│   │   ├── shared/              # Shared persistence & HTTP infrastructure
│   │   └── game.module.ts       # Domain orchestrator
│   │
│   └── shared/                  # Cross-cutting concerns
│       ├── config/              # Configuration management
│       ├── logger/              # Centralized logging
│       └── persistence/         # (Shared DB infrastructure)
│
└── main.ts                      # Bootstrap
```

## Module Structure (Hexagonal Architecture Pattern)

Each module follows: **HTTP Layer** → **Use Case** → **Core Service** → **Persistence**

### **Game Module (Domain Root)**

Imports and orchestrates all game-related modules:
- EngineModule (input, log processing)
- AnalyticsModule (output, rankings)
- MatchEnginePersistenceModule (persistence)

**Controllers:** HealthController

---

### **Engine Module (Input/Ingestion)**

**Responsibility:** Parse raw logs, validate events, trigger persistence

**Structure:**
```
engine/
├── core/
│   ├── service/
│   │   └── log-parser.service.ts      # Parses log files into events
│   └── use-case/
│       ├── ingest-log.use-case.ts     # Batch ingest from file upload
│       └── log-watcher.use-case.ts    # Continuous file monitoring (chokidar)
├── http/
│   ├── ingest-log.controller.ts       # POST /game/ingest/log
│   ├── log-watcher.controller.ts      # POST /game/watch
│   └── dto/                           # Request DTOs
├── infrastructure/
│   └── (File system abstraction)
└── persistence/
    └── match-aggregate.persistence.service.ts  # Orchestrates entity saves
```

**Key Classes:**
- `LogParserService` - Tokenizes/parses log files into Match, Player, Frag events
- `IngestLogUseCase` - Validates, persists, triggers analytics
- `LogWatcherUseCase` - Long-running file monitor with incremental processing
- `MatchAggregatePersistenceService` - Coordinates inserting Match + Players + Frags

**Data Flow:**
1. Upload log file (POST `/game/ingest/log`) → LogParserService
2. Parser extracts events → IngestLogUseCase validates
3. MatchAggregatePersistenceService saves entities (Match → Players → Frags)
4. RankingCalculatorService auto-triggered or called via `/game/analytics/rankings`

**Active Ports:** HTTP (Multer file upload), File System (chokidar watcher)

---

### **Analytics Module (Output/Ranking)**

**Responsibility:** Calculate player rankings, aggregate statistics

**Structure:**
```
analytics/
├── core/
│   ├── service/
│   │   ├── ranking-calculator.service.ts   # Rank algorithm
│   │   └── winner-infos.service.ts         # Winner extraction logic
│   └── use-case/
│       └── rank-matches.use-case.ts        # Orchestrates ranking
├── http/
│   ├── analytics.controller.ts             # GET /game/analytics/rankings
│   └── dto/                                # Response DTOs
```

**Key Classes:**
- `RankMatchesUseCase` - Queries matches, triggers ranking
- `RankingCalculatorService` - Core ranking algorithm (exported for reuse)
- `WinnerInfosService` - Extracts winner info from rank results

**Data Flow:**
1. GET `/game/analytics/rankings?matchIds=...` → AnalyticsController
2. RankMatchesUseCase queries persisted Match/Player/Frag data
3. RankingCalculatorService processes → returns DTO
4. Response includes rankings per match + player stats

**Active Ports:** HTTP (REST)

---

### **Shared Persistence Module**

**Responsibility:** Drizzle ORM setup, entity definitions, repositories

**Structure:**
```
shared/persistence/
├── entity/
│   ├── match.entity.ts          # Match aggregate root
│   ├── player.entity.ts
│   ├── frags.entity.ts
│   └── schema.ts                # Drizzle schema definitions
├── repository/
│   ├── match.repository.ts
│   ├── player.repository.ts
│   ├── frags.repository.ts
├── mapper/                       # Entity ↔ DTO mapping
├── migrations/                   # Auto-generated SQL migrations
├── drizzle.config.ts            # ORM configuration
└── match-engine.persistence.module.ts
```

**Pattern:** Active Record-like repositories + entity mappers

**Core Repositories:**
- `MatchRepository` - Match CRUD + queries (e.g., by IDs)
- `PlayerRepository` - Player CRUD
- `FragsRepository` - Frag events CRUD

---

### **Shared Config Module**

**Responsibility:** Environment variables & configuration

**Structure:**
```
shared/config/
├── service/
│   └── config.service.ts        # Extends @nestjs/config
├── util/
│   └── config.factory.ts
```

**Loaded via:** `ConfigModule.forRoot()` in EngineModule

---

### **Shared Logger Module**

**Responsibility:** Centralized structured logging (Winston)

**Structure:**
```
shared/logger/
├── service/
│   └── app-logger.service.ts    # Implements NestJS LoggerService
├── interceptor/
│   └── log-url.interceptor.ts   # Logs HTTP method + URL
├── util/
│   └── logger.factory.ts
```

**Usage:** `LoggerFactory(contextName)` returns logger instance

---

## Data Model

### Entities (Drizzle Tables)

1. **Match**
   - `id` (pk)
   - `externalId` (unique identifier from log)
   - `startedAt`, `endedAt` (timestamps)
   - Metadata (e.g., mode, map)

2. **Player**
   - `id` (pk)
   - `matchId` (fk → Match)
   - `name`, `playerNumber`
   - Stats (kills, deaths, etc.)

3. **Frags** (Kill events)
   - `id` (pk)
   - `matchId`, `killerId`, `victimId` (fks)
   - `weapon`, `timestamp`

### Relationships
```
Match (1) ──→ (N) Player
Match (1) ──→ (N) Frags
Player (fk) ──← (N) Frags (as killer/victim)
```

---

## Request/Response Flow

### Ingest Log Flow
```
POST /game/ingest/log
  ↓
IngestLogController.uploadLog()
  ↓
IngestLogUseCase.execute(file)
  ↓
LogParserService.parse() → events[]
  ↓
MatchAggregatePersistenceService.save()
  ├→ MatchRepository.save()
  ├→ PlayerRepository.saveMany()
  └→ FragsRepository.saveMany()
  ↓
RankingCalculatorService.calculate()
  ↓
Response: { rankings: [...], stats: {...} }
```

### Get Rankings Flow
```
GET /game/analytics/rankings?matchIds=123,456
  ↓
AnalyticsController.getRankings()
  ↓
RankMatchesUseCase.execute()
  ↓
MatchRepository.findByIds(matchIds)
  ↓
RankingCalculatorService.calculate()
  ↓
Response: { rankings: [...] }
```

### Log Watcher Flow
```
POST /game/watch
  ↓
LogWatcherController.startWatching()
  ↓
LogWatcherUseCase.execute()
  ↓
chokidar.watch(filePath)
  ↓
On file change:
  ├→ LogParserService.parse(delta)
  ├→ MatchAggregatePersistenceService.save()
  └→ Emit update event (optional)
```

---

## Dependency Injection

**NestJS DI container manages:**
- All Services (Providers)
- Repositories
- Use Cases
- Controllers

**Module imports chain:**
```
AppModule
  └─ GameModule
      ├─ EngineModule (imports: ConfigModule, MatchEnginePersistenceModule, AnalyticsModule)
      ├─ AnalyticsModule (imports: MatchEnginePersistenceModule)
      └─ MatchEnginePersistenceModule (provides repositories)
```

---

## Error Handling & Validation

**Global:** ValidationPipe with `transform: true, whitelist: true` (main.ts)

**Validation locations:**
- DTO class properties (class-validator decorators)
- Business logic (specific exceptions in service/use-case)
- HTTP filters (error mapping to responses)

**Exception Pattern:** Custom exceptions in `engine/core/exception/` (to be checked)

---

## Logging Strategy

**Entry points logged via `LogUrlMethodInterceptor`:**
- HTTP method
- Request URL
- Context (logger context name)

**LoggerFactory pattern:** Each service/use-case gets named logger instance

---

## Transaction & Data Consistency

**Persistence flow:**
- LogParserService extracts events
- MatchAggregatePersistenceService saves as atomic sequence:
  1. Match row
  2. All Player rows
  3. All Frag rows

⚠️ **TODO:** Check if transactions are explicit (Drizzle tx wrapper) or implicit at repository level.

