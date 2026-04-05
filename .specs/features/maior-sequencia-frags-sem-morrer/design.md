# Design: Maior sequência de frags sem morrer

## Objetivo de Design

Adicionar a métrica de streak por jogador e streak máxima da partida sem quebrar o contrato atual de ranking e mantendo custo linear por partida.

## Situação Atual

- O cálculo de ranking é feito em `RankingCalculatorService.calculate(frags)`.
- O retorno por partida é montado em `RankMatchesUseCase` e serializado em DTO de analytics.
- O parser atual ignora eventos `<WORLD> killed ...`, portanto mortes por WORLD não entram na cadeia de cálculo.
- Streak de morte é resetada por qualquer morte (independente de ser causada por jogador ou evento ambiental WORLD).

## Decisão de Arquitetura

### Estratégia

1. Evoluir o cálculo de analytics para produzir, além de ranking:
- `maxStreak` por jogador
- `topStreak` por partida

2. Preservar ordenação atual do ranking:
- kills desc
- deaths asc

3. Manter comportamento atual: descartar eventos `<WORLD> killed ...` na ingestão, sem mudanças no parser.

### Mudanças por Componente

#### 1) Parser de log

Arquivo alvo:
- `src/module/game/engine/core/service/log-parser.service.ts`

Mudança:
- **Nenhuma mudança** — continua descartando linhas de world kill como atualmente.

Racional:
- Mundo (WORLD) não é jogador e não participa de ranking
- Manutenção da simplicidade: frags só incluem player-vs-player kills
- Comportamento estável já em produção

#### 2) Persistência de frags

Arquivo alvo:
- `src/module/game/engine/persistence/service/match-aggregate.persistence.service.ts`
- `src/module/game/shared/persistence/repository/match.repository.ts`

Mudança:
- **Nenhuma mudança** — frags continuam sendo only player-to-player kills.

Racional:
- Schema e repositório já atendem ao requisito
- `killerId` permanece obrigatório (sempre é um jogador)

#### 3) Cálculo de ranking + streak

Arquivo alvo:
- `src/module/game/analytics/core/service/ranking-calculator.service.ts`

Mudança de contrato:
- `PlayerStats` passa a incluir `maxStreak: number`.
- Método passa a retornar estrutura com:
  - `ranking: PlayerStats[]`
  - `topStreak: { value: number; players: string[] }`

Se manter assinatura atual for necessário para compatibilidade interna imediata:
- criar método novo `calculateWithStreak(frags)` e manter `calculate` como wrapper temporário.

Algoritmo (O(n)):
- Estado em memória:
  - `statsMapByPlayer: Map<username, { kills, deaths, maxStreak, currentStreak }>`
- Para cada frag em ordem:
  - Incrementa `kills` e `currentStreak` do killer
  - `maxStreak = max(maxStreak, currentStreak)` do killer
  - Incrementa `deaths` da vítima
  - Zera `currentStreak` da vítima
- Pós-processamento:
  - gera ranking sem `currentStreak`
  - ordena por kills desc e deaths asc
  - calcula `position`
  - calcula `topStreak` com maior `maxStreak` e lista de empatados

#### 4) Use case de analytics

Arquivo alvo:
- `src/module/game/analytics/core/use-case/rank-matches.use-case.ts`

Mudança:
- Incluir `topStreak` no `MatchRanking`.
- Consumir novo retorno do serviço de ranking.

#### 5) DTO de resposta

Arquivo alvo:
- `src/module/game/analytics/http/dto/out/analytics-response.dto.ts`

Mudança:
- `AnalyticsPlayerRankingDto` adiciona `maxStreak`.
- `AnalyticsMatchRankingDto` adiciona:
  - `topStreak: { value: number; players: string[] }`

## Contratos Internos

### Novo tipo

```ts
interface TopStreak {
  value: number;
  players: string[];
}

interface RankingCalculationResult {
  ranking: PlayerStats[];
  topStreak: TopStreak;
}
```

### PlayerStats evoluído

```ts
interface PlayerStats {
  username: string;
  kills: number;
  deaths: number;
  maxStreak: number;
  position: number;
}
```

## Fluxo de Dados

1. Ingestão lê log e produz player-to-player frags (WORLD kills descartados).
2. Persistência grava frags preservando ordem temporal.
3. MatchRepository hidrata frags ordenados por `occurredAt`.
4. RankingCalculator computa ranking e streak no mesmo loop.
5. Use case devolve ranking + topStreak por partida.
6. DTO expõe campos novos sem remover campos antigos.

## Compatibilidade

- Mudança de API é aditiva.
- Clientes antigos seguem funcionais ignorando campos extras.
- Ordenação e winner atuais permanecem inalterados.

## Test Design

## Unit tests

Alvo principal:
- `ranking-calculator.service.spec.ts` (novo ou expandido)

Casos mínimos:
1. streak simples crescente (3 kills sem morrer -> maxStreak 3)
2. reset após morte (2 kills, morre, 1 kill -> maxStreak 2)
3. empate topStreak retorna múltiplos usernames
4. partida sem frags -> ranking vazio, topStreak 0

## E2E tests

Alvo:
- `src/module/game/test/e2e/analytics.e2e.spec.ts`

Cobertura:
1. payload inclui `maxStreak` por jogador
2. payload inclui `topStreak` por partida
3. snapshots atualizados

## Riscos Técnicos

1. Reordenação de frags pode alterar streak
- Mitigação: manter ordenação explícita por `occurredAt` e critério secundário estável (id)

2. Efeito colateral em winner/bestWeapon
- Mitigação: garantir que cálculo de winner mantém critério atual

## Plano de Implementação (resumo)

1. Evoluir cálculo em `RankingCalculatorService` para produzir `maxStreak` e `topStreak`
2. Propagar resultado em use case e DTO
3. Atualizar testes unit e e2e

## Decisões Fechadas neste Design

- WORLD kills continuam sendo descartados na ingestão (comportamento atual preservado)
- Frags persistidas são apenas player-to-player kills
- Streak é resetada por qualquer morte (sem lógica especial de WORLD)
- topStreak.players retorna usernames de jogadores reais
- complexidade alvo: O(n) por partida
