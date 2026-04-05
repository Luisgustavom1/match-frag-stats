## Technical Debt & Concerns

### High Priority (Address soon)

1. **File Watcher Production Readiness**
   - `LogWatcherUseCase` uses chokidar for continuous file monitoring
   - **Concerns:**
     - No explicit file size limits or memory safeguards
     - No reconnection logic if file is deleted
     - No graceful shutdown cleanup
   - **Risk:** Memory leaks, zombie processes, file handle exhaustion in production
   - **Action:** Add bounds (max file size, timeout), implement cleanup on app shutdown, add recovery logic
   - **Status:** 🟡 MEDIUM-HIGH

2. **No Transaction Management**
   - Persistence writes Match → Players → Frags sequentially
   - **Risk:** If any step fails, partial data corruption (orphaned records)
   - **Action:** Wrap in Drizzle transaction: `db.transaction(async tx => { ... })`
   - **Status:** 🟡 MEDIUM-HIGH

### Medium Priority (Plan for next sprint)

3. **No Input Size Validation**
   - Multer file upload has no explicit max file size
   - LogParserService may buffer entire file
   - **Risk:** OOM attacks, slow processing
   - **Action:** Add Multer `limits: { fileSize: 50MB }`, stream parsing if large files expected
   - **Status:** 🟡 MEDIUM

4. **Error Handling Incomplete**
   - No global exception filter visible (only ValidationPipe)
   - Parse errors might crash endpoint instead of returning clean error response
   - **Action:** Create `HttpExceptionFilter`, catch & log all errors, return standardized error DTO
   - **Status:** 🟡 MEDIUM

5. **No Request Validation Depth**
   - DTO validation exists (class-validator)
   - But business logic validation (duplicate match, invalid rankings) likely weak
   - **Action:** Add dedicated validation service for domain-specific rules
   - **Status:** 🟡 MEDIUM

6. **Lack of API Documentation**
   - No OpenAPI/Swagger spec detected
   - README has endpoint list but no request/response schemas
   - **Action:** Add `@nestjs/swagger`, document all endpoints with examples
   - **Status:** 🟡 MEDIUM

### Low Priority (Optimize later)

7. **No Caching Layer**
   - Rankings recalculated on every GET request (no Redis/in-memory cache)
   - If many matches, expensive operation
   - **Action:** Cache ranking results, invalidate on new ingest
   - **Status:** 🟢 LOW

8. **Logging Too Verbose or Too Silent**
    - Winston configured but targets unknown (console only?)
    - No log level config per environment
    - **Action:** Add structured JSON logging, configure levels per env, add request correlation IDs
    - **Status:** 🟢 LOW

9. **No Rate Limiting**
    - POST `/game/ingest/log` and POST `/game/watch` could be abused
    - **Action:** Add throttle guards (per IP, per user, global)
    - **Status:** 🟢 LOW

10. **Database Backup Strategy**
    - No backup mechanism visible
    - **Action:** Add automated DB dumps to S3/backup service
    - **Status:** 🟢 LOW

---

## Fragile/High-Risk Code Areas

| Area | Risk | Impact | Mitigation |
|------|------|--------|-----------|
| `log-parser.service.ts` | Parsing logic dependent on exact log format; any format change breaks parsing | No matches ingested, service appears broken | Add version detection to parser, unit tests for edge cases |
| `log-watcher.use-case.ts` | File system integration, long-lived connection, no backpressure | Memory leak, zombie processes | Add cleanup hooks, graceful shutdown, rate limiting |
| `match-aggregate.persistence.service.ts` | Sequential writes without transaction | Partial data corruption | Wrap in Drizzle transaction |
| `ranking-calculator.service.ts` | Algorithm complexity unknown (likely O(n²) or worse for large datasets) | Timeout, high CPU during GET /analytics/rankings | Profile & optimize, add caching |

---

## Missing Best Practices

1. **No Database Indexes**
   - Queries on `matchId`, `playerId` might be slow at scale
   - **Action:** Add indexes in Drizzle schema

2. **No Pagination**
   - GET `/analytics/rankings` returns all matches; could be huge
   - **Action:** Add `limit`, `offset`, `sort` query params

3. **No Audit Trail**
   - No tracking of who/what/when changes data
   - **Action:** Add `createdAt`, `updatedBy` fields to entities

4. **No Soft Deletes**
   - Delete operations are permanent (if implemented)
   - **Action:** Add `deletedAt` field for logical deletes

5. **No API Versioning**
   - Breaking changes to endpoints break clients
   - **Action:** Prefix routes with `/v1/`, `/v2/`, etc.

6. **No CORS Configuration**
   - Unclear if CORS is enabled/restricted
   - **Action:** Explicit CORS policy in main.ts

---

## Dependency Health

| Package | Version | Status | Action |
|---------|---------|--------|--------|
| NestJS | ^10.0.0 | ✅ Current | Monitor for 11.x release |
| TypeScript | 5 | ✅ Latest | OK |
| Vitest | Latest | ✅ Modern | Consider ESM migration |
| Drizzle ORM | ^0.45.1 | ✅ Recent | OK |
| PostgreSQL | 18 | ✅ Latest | OK |

---

## Performance Hotspots

1. **Log Parsing** - O(n) per line, may be slow for large files
   - Profile with benchmark logs
   - Consider streaming/chunking

2. **Ranking Calculation** - Unknown complexity, likely O(n²) or worse for all-time rankings
   - Profile with increasing dataset sizes
   - Add caching, pagination

3. **File Watching** - Chokidar overhead, especially if many files or rapid changes
   - Test with high-frequency file updates
   - Consider backoff/debouncing

---

## Security Concerns

1. **No Input Sanitization** - Player names, weapons might contain SQL injections (Drizzle parameterized, so low risk) or XSS in responses
   - **Action:** Explicit input validation, output encoding

2. **No Rate Limiting** - Ingest endpoint can be flooded
   - **Action:** Add @nestjs/throttler

3. **Exposed File Watcher** - POST /game/watch could watch arbitrary FileSystem paths
   - **Action:** Whitelist allowed paths, validate user input

