# Feature Spec: Maior sequência de frags sem morrer (streak)

## Contexto

Hoje o serviço retorna ranking por partida com `kills`, `deaths`, `position` e `winner`. Falta identificar a maior sequência de eliminações consecutivas que um jogador realizou sem morrer durante a partida.

Esta feature adiciona visibilidade sobre desempenho contínuo (momentum), sem alterar a regra atual de ordenação do ranking.

## Objetivo

Identificar e expor, por partida:
1. A maior streak de cada jogador (`maxStreak`)
2. A maior streak global da partida (`topStreak`)

## Escopo

### Em escopo
- Calcular streak por jogador considerando eventos em ordem cronológica
- Expor `maxStreak` no ranking de cada jogador
- Expor `topStreak` no nível da partida
- Tratar empates da maior streak da partida
- Cobrir cenários em testes unitários e e2e

### Fora de escopo
- Alterar critério de ordenação do ranking (continua por kills desc, deaths asc)
- Persistir streak em banco (cálculo pode ser derivado em tempo de consulta)
- Criar novo endpoint
- Expor timeline completa de streaks intermediárias

## Requisitos Funcionais

### FR-001: Cálculo de streak por jogador
Para cada jogador na partida, o sistema deve calcular `maxStreak` como a maior sequência de frags feitas por ele sem que ele morra entre essas eliminações.

### FR-002: Evento de morte reseta streak atual
Quando o jogador morre (independente do killer, inclusive `<WORLD>`), a streak atual desse jogador deve ser resetada para `0`.

### FR-003: Kill incrementa streak atual do killer
Quando um jogador mata outro jogador válido, a streak atual do killer é incrementada em `+1`.

### FR-004: World kill não incrementa streak de killer
Eventos em que o killer é `<WORLD>` não incrementam streak de nenhum jogador.

### FR-005: World kill conta como morte do jogador vítima
Se `<WORLD>` matar um jogador, a streak atual da vítima deve ser resetada (pois houve morte).

### FR-006: topStreak da partida
A resposta de analytics deve expor a maior streak registrada na partida em `topStreak`.

### FR-007: Empate em topStreak
Quando houver empate na maior streak da partida, a resposta deve incluir todos os jogadores empatados.

### FR-008: Partida sem frag
Se a partida não tiver frags, `topStreak.value` deve ser `0` e `topStreak.players` deve ser `[]`.

## Regras de Negócio

### BR-001: Ordem dos eventos
O cálculo depende da ordem temporal dos frags da partida. A implementação deve garantir processamento estável na ordem em que os eventos foram registrados.

### BR-002: Streak mínima
`maxStreak` é sempre inteiro maior ou igual a `0`.

### BR-003: Jogador sem kill
Jogador que não realizou kill tem `maxStreak = 0`, mesmo que tenha mortes.

### BR-004: Independência do ranking
`maxStreak` é métrica adicional. Não altera `position` e não substitui `winner` atual.

## Contrato de API (proposto)

Endpoint existente: `GET /game/analytics/rankings`

### Alterações no payload

Adicionar em cada item de `ranking`:
- `maxStreak: number`

Adicionar em cada `match`:
- `topStreak: { value: number; players: string[] }`

### Exemplo

```json
{
  "totalMatches": 1,
  "matches": [
    {
      "matchId": "999",
      "startedAt": "2019-04-23T18:34:22.000Z",
      "endedAt": "2019-04-23T18:39:22.000Z",
      "ranking": [
        {
          "position": 1,
          "username": "Roman",
          "kills": 3,
          "deaths": 1,
          "maxStreak": 3
        },
        {
          "position": 2,
          "username": "Nick",
          "kills": 2,
          "deaths": 2,
          "maxStreak": 2
        }
      ],
      "topStreak": {
        "value": 3,
        "players": ["Roman"]
      },
      "winner": {
        "position": 1,
        "username": "Roman",
        "kills": 3,
        "deaths": 1,
        "bestWeapon": "M16"
      }
    }
  ]
}
```

## Requisitos Não Funcionais

### NFR-001: Compatibilidade retroativa
A adição de novos campos não deve quebrar clientes que ignoram propriedades desconhecidas.

### NFR-002: Complexidade
Cálculo da streak deve ser linear no número de frags da partida: `O(n)`.

### NFR-003: Determinismo
Para o mesmo conjunto ordenado de eventos, o resultado de streak deve ser sempre idêntico.

## Critérios de Aceite

### AC-001
Dado um jogador que faz 3 kills seguidas sem morrer, `maxStreak` dele deve ser `3`.

### AC-002
Dado um jogador que faz 2 kills, morre e depois faz 1 kill, `maxStreak` deve ser `2`.

### AC-003
Dado evento `<WORLD> killed PlayerX`, a streak atual de `PlayerX` deve resetar.

### AC-004
Dado partida sem kills, `topStreak.value = 0` e `topStreak.players = []`.

### AC-005
Dado dois jogadores com `maxStreak = 4` (maior da partida), `topStreak.players` deve conter ambos.

### AC-006
`position` no ranking deve continuar obedecendo regra atual (kills desc, deaths asc), independentemente de `maxStreak`.

## Impacto Técnico Esperado

- `src/module/game/analytics/core/service/ranking-calculator.service.ts`
  - Estender `PlayerStats` com `maxStreak`
  - Calcular streak atual por jogador e atualizar `maxStreak`
- `src/module/game/analytics/http/dto/out/analytics-response.dto.ts`
  - Incluir `maxStreak` no DTO de ranking
  - Incluir `topStreak` no DTO de partida
- `src/module/game/analytics/core/use-case/rank-matches.use-case.ts`
  - Propagar metadado de `topStreak` (se necessário)
- `src/module/game/test/e2e/analytics.e2e.spec.ts`
  - Novos cenários de streak e ajuste dos snapshots
- Testes unitários do cálculo de ranking/streak

## Dependências

- Nenhuma dependência externa nova
- Reuso da lista de frags já obtida no fluxo atual de analytics

## Riscos e Mitigações

- Risco: ordem de eventos inconsistente na origem
  - Mitigação: garantir ordenação explícita por timestamp/id antes do cálculo
- Risco: confusão entre regra de ranking e regra de streak
  - Mitigação: manter critérios desacoplados e cobrir em testes

## Open Questions

1. `topStreak.players` deve conter apenas username ou também dados completos do jogador?
2. Em caso de empate em `topStreak`, deve haver ordenação estável alfabética no array de players?
3. Devemos considerar `<WORLD>` como "jogador" no campo `players` (proposta atual: não)

## Decisões Assumidas Nesta Spec

- `<WORLD>` nunca entra em ranking nem em `topStreak.players`
- Morte por `<WORLD>` reseta streak da vítima
- `topStreak.players` é lista de usernames (string)
- Alteração é aditiva no payload e retrocompatível

## Definition of Done

- Requisitos FR-001..FR-008 implementados
- Critérios AC-001..AC-006 cobertos por testes
- Snapshots e2e atualizados
- Todos os testes unit e e2e passando
- Sem regressão no ranking já existente
