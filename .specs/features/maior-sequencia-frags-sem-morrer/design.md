# Design: Maior sequência de frags sem morrer

## Objetivo de Design

Adicionar a métrica de streak por jogador e streak máxima da partida sem quebrar o contrato atual de ranking e mantendo custo linear por partida.

## Situação Atual

- O cálculo de ranking é feito em `RankingCalculatorService.calculate(frags)`.
- O retorno por partida é montado em `RankMatchesUseCase` e serializado em DTO de analytics.
- O parser atual ignora eventos `<WORLD> killed ...`, portanto mortes por WORLD não entram na cadeia de cálculo.

## Decisão de Arquitetura

### Estratégia

1. Evoluir o cálculo de analytics para produzir, além de ranking:
- `maxStreak` por jogador
- `topStreak` por partida

2. Preservar ordenação atual do ranking:
- kills desc
- deaths asc

3. Introduzir suporte explícito para mortes por WORLD na ingestão, para cumprir a regra de reset de streak por morte do jogador.

### Mudanças por Componente

#### 1) Parser de log

Arquivo alvo:
- `src/module/game/engine/core/service/log-parser.service.ts`

Mudança:
- Deixar de descartar linha de world kill.
- Converter world kill em evento interno de frag especial, com marcador de killer WORLD.

Opção escolhida:
- Criar `FragsModel` com `killerUsername = "<WORLD>"` e manter `victimUsername` e `occurredAt`.

Racional:
- Menor impacto estrutural
- Reaproveita pipeline existente (match -> persistence -> analytics)
- Permite reset da streak da vítima na análise

#### 2) Persistência de frags

Arquivos alvo:
- `src/module/game/engine/persistence/service/match-aggregate.persistence.service.ts`
- `src/module/game/shared/persistence/repository/match.repository.ts`

Mudança:
- Persistir frag de WORLD sem depender de `killerId` obrigatório.

Ajuste esperado:
- `killerId` em frags precisa aceitar null para world kill, ou criar registro técnico WORLD em player.

Opção preferida:
- `killerId` nullable para representar evento ambiental.

Racional:
- Evita poluir ranking com jogador técnico WORLD
- Modela corretamente semântica de evento

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
  - Se killer != `<WORLD>`:
    - incrementa `kills` e `currentStreak` do killer
    - `maxStreak = max(maxStreak, currentStreak)`
  - Sempre para vítima:
    - incrementa `deaths`
    - zera `currentStreak`
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

1. Ingestão lê log e inclui player kills e world kills.
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
3. morte por WORLD reseta streak da vítima
4. empate topStreak retorna múltiplos usernames
5. partida sem frags -> ranking vazio, topStreak 0

## E2E tests

Alvo:
- `src/module/game/test/e2e/analytics.e2e.spec.ts`

Cobertura:
1. payload inclui `maxStreak` por jogador
2. payload inclui `topStreak` por partida
3. cenário com WORLD kill refletindo reset de streak
4. snapshots atualizados

## Riscos Técnicos

1. Persistência atual pode descartar frag com killer ausente
- Mitigação: ajustar schema/repositório para `killerId` nullable

2. Reordenação de frags pode alterar streak
- Mitigação: manter ordenação explícita por `occurredAt` e critério secundário estável (id)

3. Efeito colateral em winner/bestWeapon
- Mitigação: garantir que cálculo de winner ignore WORLD no mesmo critério atual

## Plano de Implementação (resumo)

1. Ajustar parser para produzir evento de world kill
2. Ajustar persistência para aceitar world kill
3. Evoluir cálculo para `maxStreak` e `topStreak`
4. Propagar em use case e DTO
5. Atualizar testes unit e e2e

## Decisões Fechadas neste Design

- WORLD não entra em ranking nem em topStreak.players
- WORLD kill reseta streak da vítima
- topStreak.players retorna usernames
- complexidade alvo: O(n) por partida
