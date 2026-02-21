# match-frag-stats

Serviço backend que **ingere logs de partidas**, analisa eventos de frag, calcula rankings por partida e expõe os resultados via API REST.

---

## Visão Geral

O serviço recebe um arquivo de log de uma partida (FPS), extrai os eventos de kill (frags), persiste os dados e fornece endpoints para consulta de rankings e estatísticas. A lógica de negócio é organizada em módulos independentes seguindo Clean Architecture dentro do NestJS.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [NestJS](https://nestjs.com/) |
| Linguagem | TypeScript 5 |
| Banco de dados | PostgreSQL 18 (via Docker) |
| ORM / Migrations | [Drizzle ORM](https://orm.drizzle.team/) + drizzle-kit |
| Testes | [Vitest](https://vitest.dev/) (unit + e2e) |
| Linting / Formatação | [Biome](https://biomejs.dev/) |
| Logs | Winston (nest-winston) |

---

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/game/ingest/log` | Recebe um arquivo de log (`multipart/form-data`, campo `log`) e retorna o ranking de todas as partidas encontradas |
| `GET` | `/game/analytics/rankings` | Retorna rankings de partidas já persistidas; aceita filtro por `matchIds` via query string |
| `GET` | `/health` | Verificação de saúde da aplicação |

---

## Estrutura de Módulos (monolito modular)

```
src/module/game/
├── engine/          # Ingestão e parsing de logs
├── analytics/       # Rankings
└── shared/
    └── persistence/ # Entidades Drizzle, repositórios, migrations
    └── http/ # Elementos http compatilhados, como health check, clients e etc...
```

---

## Como Rodar

### Pré-requisitos

- Docker e Docker Compose
- pnpm (apenas para o fluxo local)
- Node.js 20+ (apenas para o fluxo local)

---

### Opção A — Tudo em Docker

Sobe o banco de dados **e** a aplicação em containers. A pasta `src/` é montada
como volume, então o hot-reload funciona normalmente.

#### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

> O `DATABASE_HOST` é sobrescrito automaticamente pelo Docker Compose para `db`,
> portanto não é necessário alterar a variável no arquivo `.env`.

#### 2. Build da imagem

```bash
pnpm docker:build
```

#### 3. Subir todos os serviços

```bash
pnpm docker:start
```

#### 4. Rodar as migrations

```bash
docker exec -it frag_stats_app pnpm game:db:migrate
```

A aplicação estará disponível em `http://localhost:3000`.

---

### Opção B — Banco em Docker, aplicação local

#### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

#### 2. Subir apenas o banco de dados

```bash
pnpm docker:start:db
```

#### 3. Instalar dependências

```bash
pnpm install
```

#### 4. Rodar as migrations

```bash
pnpm game:db:migrate
```

#### 5. Iniciar a aplicação

```bash
# desenvolvimento (watch mode)
pnpm start:dev

# produção
pnpm build && pnpm start:prod
```

---

## Testes

```bash
# todos os testes
pnpm test

# apenas unit tests
pnpm test:unit

# apenas e2e
pnpm test:e2e

# cobertura
pnpm test:coverage
```

---

## Migrations

As migrations são gerenciadas pelo drizzle-kit. Para gerar uma nova migration após alterar as entidades:

```bash
pnpm game:db:generate
```

---

## Documentação

- [Arquitetura, Design e Decisões de DDD](docs/architecture.md)

---

## Observações

- **Idempotência na ingestão**: o ingest usa `onConflictDoNothing` nas operações de insert em lote, tornando seguro re-ingerir o mesmo log sem duplicar dados (apenas os frags que são inseridos novamente).
- **Transação única por ingest**: players, matches, frags são persistidos em uma única transação para garantir consistência.
- **Awards** (próxima feature): ao final de cada partida serão calculados e persistidos awards como `FLAWLESS_VICTORY` e `KILLING_SPREE`.
- **Variáveis de ambiente**: copie `.env.example` (se existir) ou configure as variáveis de conexão com o banco antes de rodar. O Docker Compose utiliza usuário/senha `frag_stats` por padrão na porta `5432`.
