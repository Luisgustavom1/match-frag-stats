# Tasks: Maior sequência de frags sem morrer

**Spec**: `.specs/features/maior-sequencia-frags-sem-morrer/spec.md`
**Design**: `.specs/features/maior-sequencia-frags-sem-morrer/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

`T1 -> T2`

### Phase 2: Core Implementation (Parallel OK)

Após `T2`:

`T3 [P]` e `T4 [P]`

### Phase 3: Integration (Sequential)

`T5 -> T6`

---

## Task Breakdown

### T1: Propagar world kill no domínio de ingestão

**What**: Ajustar parser e modelo para preservar evento de `<WORLD> killed X by Y` como frag válido para analytics, sem inserir `<WORLD>` na lista de jogadores da partida.
**Where**:
- `src/module/game/engine/core/service/log-parser.service.ts`
- `src/module/game/engine/core/model/match.model.ts`
- `src/module/game/test/unit/log-parser.service.spec.ts`
- `src/module/game/test/unit/match.model.spec.ts`
**Depends on**: None
**Reuses**:
- Padrão atual de parsing de kills em `LogParserService`
- Regras de limite de jogadores em `MatchModel`
**Requirements**: FR-002, FR-004, FR-005, BR-003

**Done when**:
- [ ] `LogParserService` não descarta world kill
- [ ] World kill gera frag com killer `<WORLD>`
- [ ] `MatchModel.addFrag` não adiciona `<WORLD>` em `players`
- [ ] Testes unitários cobrindo world kill e limite de jogadores passam

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T2: Suportar world kill na persistência

**What**: Ajustar schema/repositórios/mappers para persistir frag de world kill sem `killerId` real de jogador.
**Where**:
- `src/module/game/shared/persistence/entity/frags.entity.ts`
- `src/module/game/shared/persistence/mapper/frags.mapper.ts`
- `src/module/game/engine/persistence/service/match-aggregate.persistence.service.ts`
- `src/module/game/shared/persistence/repository/match.repository.ts`
- `src/module/game/shared/persistence/migrations/*` (nova migration)
- Testes de persistência/e2e impactados
**Depends on**: T1
**Reuses**:
- Transação existente em `MatchAggregatePersistenceService`
- Hidratação de partida em `MatchRepository.findAllWithFragsAndPlayers`
**Requirements**: FR-005, BR-001

**Done when**:
- [ ] `killerId` suporta null para frag de WORLD
- [ ] Migration criada e aplicável sem quebrar dados existentes
- [ ] Persistência não lança erro quando killer é `<WORLD>`
- [ ] Hidratação de frags mantém killer `<WORLD>` para analytics

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T3: Calcular maxStreak por jogador

**What**: Evoluir `RankingCalculatorService` para calcular `maxStreak` por jogador no mesmo loop de kills/deaths, mantendo ordenação atual de ranking.
**Where**:
- `src/module/game/analytics/core/service/ranking-calculator.service.ts`
- Novo/atualizado spec de unit do ranking calculator
**Depends on**: T2
**Reuses**:
- Contrato atual `PlayerStats`
- Critério de ordenação kills desc / deaths asc
**Requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, BR-002, BR-004

**Done when**:
- [ ] `PlayerStats` inclui `maxStreak`
- [ ] Algoritmo mantém complexidade O(n)
- [ ] Morte (inclusive por WORLD) zera streak atual da vítima
- [ ] Ranking continua ordenado por kills/deaths (sem usar streak)
- [ ] Unit tests cobrem streak crescente, reset e jogador sem kills

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T4: Calcular topStreak da partida

**What**: Produzir `topStreak` (valor e jogadores empatados) como resultado agregado por partida.
**Where**:
- `src/module/game/analytics/core/service/ranking-calculator.service.ts`
- `src/module/game/analytics/core/use-case/rank-matches.use-case.ts`
- Tipos internos de resultado de ranking
**Depends on**: T2
**Reuses**:
- Resultado do cálculo de `maxStreak` gerado em T3
**Requirements**: FR-006, FR-007, FR-008

**Done when**:
- [ ] Use case retorna `topStreak` por partida
- [ ] Empates incluem todos os jogadores com maior streak
- [ ] Partida sem frags retorna `topStreak.value = 0` e `players = []`
- [ ] Unit tests cobrem empate e caso vazio

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T5: Expor novos campos no contrato HTTP de analytics

**What**: Atualizar DTO de saída para incluir `maxStreak` no ranking e `topStreak` no match response.
**Where**:
- `src/module/game/analytics/http/dto/out/analytics-response.dto.ts`
- `src/module/game/analytics/http/analytics.controller.ts` (se necessário)
- `src/module/game/analytics/http/dto/out/*` (tipos auxiliares, se necessário)
**Depends on**: T3, T4
**Reuses**:
- Estrutura atual de serialização de `MatchRankingsAnalyticsResponseDto`
**Requirements**: FR-001, FR-006, FR-007, FR-008, NFR-001

**Done when**:
- [ ] Cada item de ranking possui `maxStreak`
- [ ] Cada partida possui `topStreak`
- [ ] Campos existentes (`winner`, `position`, `kills`, `deaths`) permanecem compatíveis

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T6: Cobertura end-to-end e regressão

**What**: Ajustar e2e + snapshots para validar a feature e evitar regressão no ranking atual.
**Where**:
- `src/module/game/test/e2e/analytics.e2e.spec.ts`
- `src/module/game/test/e2e/__snapshots__/*`
- Recursos de log em `src/module/game/test/resources/*` (se necessário)
**Depends on**: T5
**Reuses**:
- Cenários e2e existentes de analytics
**Requirements**: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006

**Done when**:
- [ ] Cenário de streak simples aprovado
- [ ] Cenário com reset após morte aprovado
- [ ] Cenário com world kill resetando streak aprovado
- [ ] Cenário de empate topStreak aprovado
- [ ] Snapshot atualizado e sem regressão em ordenação de ranking
- [ ] Suite unit + e2e verde

**Tests**: unit + e2e
**Gate**: `pnpm test:unit && pnpm test:e2e`

---

## Parallel Execution Map

```text
Phase 1 (Sequential)
T1 -> T2

Phase 2 (Parallel)
T2 -> T3 [P]
T2 -> T4 [P]

Phase 3 (Sequential)
T3 + T4 -> T5 -> T6
```

---

## Validation Tables

### 1) Task Granularity Check

| Task | Atomic? | Rationale |
|---|---|---|
| T1 | Yes | Domínio de ingestão (parser + modelo + unit tests co-localizados) |
| T2 | Yes | Persistência world kill (schema + mapper + repository + migration) |
| T3 | Yes | Cálculo de `maxStreak` no serviço de ranking |
| T4 | Yes | Cálculo de `topStreak` e propagação no use case |
| T5 | Yes | Serialização HTTP/DTO dos novos campos |
| T6 | Yes | Validação e2e + snapshots/regressão |

### 2) Dependency Cross-Check

| Task | Depends on (declared) | Diagram consistency |
|---|---|---|
| T1 | None | OK |
| T2 | T1 | OK |
| T3 | T2 | OK |
| T4 | T2 | OK |
| T5 | T3, T4 | OK |
| T6 | T5 | OK |

### 3) Test Co-location Validation

| Task | Code touch | Required tests | Included? |
|---|---|---|---|
| T1 | Engine core parser/model | unit | Yes |
| T2 | Persistence + migration | e2e | Yes |
| T3 | Analytics core service | unit | Yes |
| T4 | Analytics core/use-case | unit | Yes |
| T5 | HTTP DTO/contract | e2e | Yes |
| T6 | E2E scenarios/snapshots | unit+e2e regression | Yes |

---

## Gate Strategy

- **Quick gate (local task-level)**: `pnpm test:unit`
- **Full integration gate**: `pnpm test:e2e`
- **Final gate**: `pnpm test:unit && pnpm test:e2e`
