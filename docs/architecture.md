# Arquitetura e Design do Projeto

## Visão Geral

O projeto utiliza princípios de **Domain-Driven Design (DDD)** dentro do framework NestJS, organizado como um **monolito modular**. Cada módulo possui *boundaries* bem definidas e expõe apenas o necessário para os demais.

---

## Estrutura de Pastas

```
src/
└── module/
    ├── shared/               # Infraestrutura transversal (config, logger, banco)
    └── game/                 # Domínio principal
        ├── engine/           # Contexto: Ingestão de logs
        │   ├── core/
        │   │   ├── model/    # Modelos de domínio
        │   │   ├── service/  # Serviços de domínio
        │   │   └── use-case/ # Casos de uso
        │   └── http/         # Controllers e DTOs de entrada/saída
        │   └── persistence/  # Infraestrutura de persistência específica da engine
        ├── analytics/        # Contexto: Rankings
        │   ├── core/
        │   │   ├── service/
        │   │   └── use-case/
        │   └── http/
        └── shared/
            └── persistence/  # Infraestrutura de persistência compartilhada
                ├── entity/   # Esquemas Drizzle (camada de banco)
                ├── mapper/   # Conversão domínio ↔ banco
                ├── repository/
                ├── service/
                └── migrations/
```

---

## Camadas

### Core (Domínio)

Contém toda a lógica de negócio. É composta por:

- **Models** — entidades e objetos de valor do domínio
- **Services** — serviços de domínio com lógica reutilizável
- **Use Cases** — orquestram a execução de uma operação de negócio

### HTTP

Responsável pela entrada e saída via REST. Os controllers delegam imediatamente para use cases e convertem o resultado em DTOs de resposta. Não contém lógica de negócio.

### Persistence

Camada de infraestrutura isolada no módulo `shared/persistence`. Os repositórios e mapeadores traduzem entre o modelo de domínio e as entidades do banco, de modo que o domínio nunca conhece o Drizzle ou o PostgreSQL.

---

## Módulos do Domínio

### `engine` — Contexto de Ingestão

Responsável por receber o arquivo de log bruto, interpretá-lo e persistir o resultado.

| Componente | Responsabilidade |
|---|---|
| `LogParserService` | Parseia o texto do log e constrói os `MatchModel` com seus frags |
| `IngestLogUseCase` | Orquestra: parse → persistência → cálculo de ranking imediato |
| `IngestLogController` | Recebe o upload de arquivo (`multipart/form-data`) e retorna o resultado |

### `analytics` — Contexto de Rankings

Responsável por calcular e retornar rankings a partir dos dados já persistidos.

| Componente | Responsabilidade |
|---|---|
| `RankingCalculatorService` | Calcula `kills`, `deaths` e `position` por jogador a partir dos frags |
| `WinnerInfosService` | Determina as informações do vencedor de uma partida |
| `RankMatchesUseCase` | Busca partidas no repositório, calcula rankings e agrega informações do vencedor |
| `AnalyticsController` | Expõe o endpoint de consulta com filtro opcional por `matchIds` |

---

## Modelo de Domínio

### `MatchModel` — Aggregate Root

A partida é o agregado central. Ela encapsula seus frags e jogadores e controla as invariantes:

- Não permite adicionar frags a uma partida já encerrada
- Mantém internamente um `Map<username, PlayerModel>` para garantir unicidade de jogadores
- O método `addFrag()` é a única porta de entrada para modificar o estado do agregado
- Limita o número máximo de jogadores por partida (`MAX_PLAYERS = 20`)

```
MatchModel (Aggregate Root)
  ├── FragsModel[]   (lista de eventos de kill)
  └── PlayerModel[]  (jogadores derivados dos frags)
```

### `FragsModel`

Representa um evento de kill: quem matou, quem morreu, com qual arma e em que momento. É um **objeto de valor imutável** após a criação.

### `PlayerModel`

Identifica um jogador pelo `username`. É mantido dentro do agregado `MatchModel`.

---

## Decisões de Design

### Separação entre modelo de domínio e entidade de banco

Os modelos de domínio (`MatchModel`, `FragsModel`, `PlayerModel`) são classes TypeScript puras sem nenhum decorator de ORM. As entidades Drizzle (`match.entity.ts`, etc.) existem apenas na camada de persistência.

A conversão entre as duas representações é feita pelos **Mappers** (`MatchMapper`, `FragsMapper`, `PlayerMapper`), que recebem os dados relacionais (IDs numéricos, FKs) e os traduzem para o modelo de domínio e vice-versa.

### `MatchAggregatePersistenceService` — Persistência em uma única transação

Para garantir consistência, toda a operação de ingest é realizada em **uma única transação de banco**:

1. `bulkCreate` de players (upsert por username)
2. `bulkCreate` de matches (upsert por externalId)
3. `bulkInsert` de frags (insert com `onConflictDoNothing`)

Esse serviço orquestra os repositórios individualmente e resolve as referências de ID (FK) necessárias para o insert de frags antes de delegá-las ao `FragsRepository`.

### Idempotência na ingestão

O mesmo log pode ser submetido múltiplas vezes sem duplicar dados. Isso é garantido por:

- `onConflictDoNothing` nos inserts de frag
- Upsert (insert ou ignorar) para players e matches baseado em chave única (`username`, `externalId`)

### `RankingCalculatorService` no `AnalyticsModule`, consumido pelo `EngineModule`

O cálculo de ranking é proprietário do contexto `analytics`, mas é necessário também no retorno imediato do ingest. Em vez de duplicar a lógica, o `AnalyticsModule` exporta o `RankingCalculatorService`, que o `EngineModule` importa via dependência de módulo. Isso mantém a lógica centralizada sem criar acoplamento bidirecional.

### Módulo de persistência compartilhado (`MatchEnginePersistenceModule`)

`engine` e `analytics` precisam dos mesmos repositórios. O módulo de persistência é declarado como `shared` dentro do domínio `game` e importado pelos dois contextos. Não existe lógica de negócio nesse módulo — apenas infraestrutura.

### Cálculo de ranking em memória (sem persistência)

O ranking **não é persistido** no banco. Ele é recalculado a partir dos frags sempre que necessário. Isso simplifica o modelo de dados e elimina o risco de inconsistência entre os frags e o ranking armazenado, ao custo de uma computação leve a cada consulta.
