# Feature: Awards

## Visão Geral

Awards são conquistas atribuídas a jogadores ao final de uma partida com base em seu desempenho. Cada award é calculado a partir dos dados de frags já existentes e persistido em uma nova tabela no banco.

## Awards

| Award | Regra |
|---|---|
| `FLAWLESS_VICTORY` | Jogador(es) na posição #1 do ranking (mais kills) que terminou a partida com `deaths === 0` |
| `KILLING_SPREE` | Jogador que registrou 5 kills dentro de uma janela de 60 segundos |

**Critérios adicionais:**
- Empate no rank #1: todos os jogadores com kills igual ao líder e `deaths === 0` recebem `FLAWLESS_VICTORY`
- `KILLING_SPREE`: sliding window de 5 frags — se `frags[i+4].occurredAt - frags[i].occurredAt <= 60_000ms`, o award é concedido

---

## Decisões de Design

- **Calculados no ingest, persistidos no banco**: garante consistência e evita recomputação cara em cada consulta
- **`bulkCreate` com `onConflictDoNothing`**: idempotente para reingestão do mesmo log
- **Constraint `UNIQUE(player_id, match_id, type)`**: impede duplicatas por award por partida por jogador

---

## Plano de Implementação

### 1. Domain Model — `AwardModel`

Criar `src/module/game/engine/core/model/award.model.ts`:

```ts
export enum AwardType {
  FLAWLESS_VICTORY = 'FLAWLESS_VICTORY',
  KILLING_SPREE    = 'KILLING_SPREE',
}

export interface AwardModel {
  id:               number;
  playerUsername:   string;
  matchExternalId:  string;
  type:             AwardType;
  createdAt:        Date;
}
```

---

### 2. `AwardCalculatorService`

Criar `src/module/game/engine/core/service/award-calculator.service.ts`:

- Método: `calculateForMatch(match: MatchModel, ranking: PlayerStats[]): AwardModel[]`

**FLAWLESS_VICTORY:**
```
topKills = ranking[0].kills
winners  = ranking.filter(p => p.kills === topKills && p.deaths === 0)
→ cada um recebe FLAWLESS_VICTORY
```

**KILLING_SPREE:**
```
Para cada jogador:
  frags = match.frags
          .filter(f => f.killerUsername === player.username)
          .sort por occurredAt ASC

  Para i = 0 até frags.length - 5:
    se frags[i+4].occurredAt - frags[i].occurredAt <= 60_000ms:
      concede KILLING_SPREE e para o loop
```

---

### 3. Drizzle Entity

Criar `src/module/game/shared/persistence/entity/award.entity.ts`:

```
Tabela: match_engine.award
  id         — serial PK
  player_id  — FK → player.id
  match_id   — FK → match.id
  type       — varchar(50)
  created_at — timestamp, defaultNow
  
  UNIQUE(player_id, match_id, type)
```

Exportar do `entity/index.ts`.

---

### 4. `AwardMapper`

Criar `src/module/game/shared/persistence/mapper/award.mapper.ts`:

- `toEntity(award, playerIdsByUsername, matchIdsByExternalId)` → row para insert
- `toDomain(row, playerUsername, matchExternalId)` → `AwardModel`

Mesma abordagem do `FragsMapper` que recebe strings de nomes/ids externamente.

---

### 5. `AwardRepository`

Criar `src/module/game/shared/persistence/repository/award.repository.ts`:

- `bulkCreate(awards, playerIdsByUsername, matchIdsByExternalId)` — insert com `onConflictDoNothing`
- `findByMatchExternalIds(externalIds?: string[]): Promise<AwardModel[]>` — JOIN com `player` e `match`

---

### 6. Drizzle Migration

```bash
pnpm drizzle-kit generate
```

Gera a migration da tabela `award` em `src/module/game/shared/persistence/migrations/`.

---

### 7. `MatchAggregatePersistenceService`

Estender `src/module/game/shared/persistence/service/match-aggregate.persistence.service.ts` para aceitar `AwardModel[]` e persistir dentro da mesma transação, como step 4 após o insert de frags:

```
Transação:
  1. upsert players
  2. upsert matches
  3. bulk insert frags
  4. bulk insert awards  ← novo
```

---

### 8. Ingest Use-Case

Estender `src/module/game/engine/core/use-case/ingest-log.use-case.ts`:

```
Para cada match:
  ranking = rankingCalculator.calculate(match.frags)
  awards  = awardCalculator.calculateForMatch(match, ranking)

Passar awards ao MatchAggregatePersistenceService
```

---

### 9. Analytics Query Use-Case

Estender `src/module/game/analytics/core/use-case/rank-matches.use-case.ts`:

```
matchIds → load matches via repository
awards   = awardRepository.findByMatchExternalIds(externalIds)
→ associar awards às PlayerStats por (matchExternalId, username)
```

---

### 10. `PlayerStats` Interface

Adicionar `awards: AwardType[]` à interface `PlayerStats` em `ranking-calculator.service.ts`.

---

### 11. DTO de Resposta

Estender `src/module/game/analytics/http/dto/out/awards-response.dto.ts`:

```ts
// AwardsPlayerDto
awards: string[];  // ← novo campo

constructor(stats: PlayerStats, position: number) {
  // ...campos existentes...
  this.awards = stats.awards;
}
```

---

### 12. Module Wiring

- Registrar `AwardCalculatorService` em `engine.module.ts`
- Registrar `AwardRepository` em `match-engine.persistence.module.ts`

---

## Testes

### Unit Tests — `AwardCalculatorService`

Arquivo: `src/module/game/test/unit/award-calculator.service.spec.ts`

| Cenário | Resultado esperado |
|---|---|
| Top player com deaths = 0 | Recebe `FLAWLESS_VICTORY` |
| Top player com deaths > 0 | Não recebe `FLAWLESS_VICTORY` |
| Empate no topo, ambos com deaths = 0 | Ambos recebem `FLAWLESS_VICTORY` |
| 5 kills em 59s | Recebe `KILLING_SPREE` |
| 5 kills em exatamente 60s | Recebe `KILLING_SPREE` |
| 5 kills em 61s | Não recebe `KILLING_SPREE` |
| Apenas 4 kills no total | Não recebe `KILLING_SPREE` |

### E2E

- Atualizar snapshots de `analytics.e2e.spec.ts` e `ingest-log.e2e.spec.ts` com o novo campo `awards` no response

---

## Diagrama de Fluxo

```
POST /game/ingest/log
  │
  ├─ LogParserService.parse()         → MatchModel[]
  ├─ RankingCalculatorService         → PlayerStats[] por match
  ├─ AwardCalculatorService           → AwardModel[] por match      ← novo
  └─ MatchAggregatePersistenceService → persiste tudo em 1 transação ← estendido
       ├─ upsert players
       ├─ upsert matches
       ├─ insert frags
       └─ insert awards                                              ← novo

GET /game/engine/rankings
  │
  ├─ MatchRepository.findAllWithFragsAndPlayers()
  ├─ AwardRepository.findByMatchExternalIds()                        ← novo
  ├─ RankingCalculatorService.calculate()
  └─ Merge awards → PlayerStats.awards[]                            ← novo
```
