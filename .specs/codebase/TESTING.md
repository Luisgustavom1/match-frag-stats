## Testing Framework

**Test Runner:** Vitest (v2+)
- Multi-project configuration (unit + e2e)
- Snapshot testing support
- Coverage reporting (output to `coverage/`)

**Assertion Library:** Vitest built-in (similar to Jest)

**Configuration:**
- **Root config:** `vitest.config.ts` (orchestrator)
- **Unit tests:** `test/vitest.config.unit.ts` (isolated tests)
- **E2E tests:** `test/vitest.config.e2e.ts` (integration/full HTTP tests)
- **Setup:** `test/test.setup.ts` (global test utilities)

---

## Test Structure & Patterns

### Unit Tests

**Location:** `src/module/game/test/unit/`

**Examples:**
- `log-parser.service.spec.ts` - Isolated parsing logic
- `match.model.spec.ts` - Model validation & methods

**Pattern:**
```typescript
describe("LogParserService", () => {
  it("parses log line into event", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

**Dependencies:** Mocked (if needed) with test mocks from `test/mocks/`

---

### E2E Tests

**Location:** `src/module/game/test/e2e/`

**Examples:**
- `ingest-log.e2e.spec.ts` - Full POST /game/ingest/log flow
- `log-watcher.e2e.spec.ts` - File watcher integration
- `analytics.e2e.spec.ts` - GET /game/analytics/rankings flow
- `health.e2e.spec.ts` - Health check endpoint

**Pattern:**
```typescript
describe("IngestLogController (e2e)", () => {
  it("uploads log file and returns rankings", async () => {
    // Setup: start app, prepare test data
    // Request: POST /game/ingest/log with file
    // Assert: Status 200, response shape, database state
  });
});
```

**Scope:** Full HTTP layer, real database (test DB), real services; excludes external APIs if mocked

**Snapshots:** `__snapshots__/` directory stores expected responses

---

## Test Mocks

**Location:** `test/mocks/`

**Existing:**
- `logger.ts` - Mock AppLogger for tests

**Pattern:**
```typescript
export const mockLogger = {
  log: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  // ... NestJS LoggerService interface
};
```

---

## Coverage Configuration

**Output:** `coverage/` directory (auto-generated)
- `index.html` - Interactive coverage report
- `coverage-final.json` - Machine-readable
- `clover.xml` - CI/CD integration format

**Command:** `pnpm test:coverage`

---

## Test Execution Patterns

| Command | What | Use Case |
|---------|------|----------|
| `pnpm test` | All tests (unit + e2e) | CI/CD, pre-commit |
| `pnpm test:unit` | Unit tests only | Quick feedback during dev |
| `pnpm test:e2e` | E2E tests only | Integration validation |
| `pnpm test:watch` | Watch mode (all) | Development TDD |
| `pnpm test:coverage` | Coverage report | Metrics, CI gates |

---

## Data Setup for Tests

**Test Resources:**
- Location: `src/module/game/test/e2e/resources/`
- Content: Sample logs, fixtures, test data

**Pattern:**
```typescript
import testLog from "./resources/sample-match.log";

describe("E2E", () => {
  it("parses sample log", async () => {
    const file = Buffer.from(testLog);
    // Upload and assert
  });
});
```

---

## Known Test Practices

**Observed:**
1. ✅ Snapshot testing for API responses (see `__snapshots__/`)
2. ✅ Unit + E2E split (separate vitest projects)
3. ✅ Mock logger for tests (avoids noise)
4. ✅ File system test resources (sample logs)

**Recommended:**
- Isolation: Mock external deps in unit tests
- Seeding: Use test database migrations before E2E suite
- Cleanup: Truncate DB tables after each E2E test
- Fixtures: Keep test data in `resources/` (as observed)

