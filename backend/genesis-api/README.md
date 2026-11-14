# Genesis API

Node.js, Express, TypeScript e PostgreSQL (driver `pg`, sem ORM), organizada em Clean Architecture.
Pensada para rodar com um Postgres gerenciado pela [Neon](https://neon.tech), hospedada na Vercel
via o deploy zero-config de Express (ver `src/index.ts`).

## Estrutura

```
src/
  config/        env (validado com zod) e pool de conexão com o PostgreSQL
  middlewares/   publicApiKey, auth (JWT), rateLimiters, errorHandler
  modules/
    projects|quotes|users/
      domain/        entidades e contratos de repositório
      application/   casos de uso (services)
      infra/         repositórios Postgres (SQL parametrizado via `pg`)
      http/          controllers e schemas de validação (zod)
  routes/        public, admin e index
  shared/        AppError, paginação, respostas, validação comum
  container.ts   composição das dependências
  app.ts         configuração do Express (factory `createApp`)
  server.ts      bootstrap e shutdown gracioso (uso local/servidor tradicional)
  index.ts       entrypoint do deploy zero-config na Vercel (exporta o app, sem `.listen`)
  scripts/       create-admin, migrate
sql/
  schema.sql     schema idempotente (tabelas, tipos enum, índices)
```

## Como rodar

```bash
cp .env.example .env   # preencha DATABASE_URL com seu Postgres (local ou Neon)
npm install
npm run migrate        # cria tabelas/tipos/índices (idempotente)
npm run create-admin -- "Seu Nome" voce@genesis.com "senha-forte-123"
npm run dev
```

Produção (servidor tradicional): `npm run build && npm start`.

## Deploy na Vercel + Neon

1. Crie um projeto e um banco no [Neon](https://neon.tech) e copie a connection string
   **pooled** (contém `-pooler` no host) — ela é a indicada para ambiente serverless.
2. Rode `npm run migrate` uma vez com `DATABASE_URL` apontando para esse banco (local
   ou via `vercel env pull`), e depois `npm run create-admin -- ...` para criar o primeiro usuário.
3. Importe este diretório (`backend/genesis-api`) como um projeto na Vercel (Root Directory =
   `backend/genesis-api`, Framework Preset = Other; não precisa de Build Command nem
   Output Directory — a Vercel detecta `src/index.ts` e roda o Express zero-config).
4. Configure as env vars do projeto na Vercel: `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_API_KEY`,
   `CORS_ORIGINS` (domínios do frontend/admin na Vercel), `NODE_ENV=production`.

## Endpoints (`/api/v1`)

| Método | Rota | Acesso |
| --- | --- | --- |
| GET | `/public/projects?search&category&isPreset&page&limit` | `X-API-KEY` |
| GET | `/public/projects/:slug` | `X-API-KEY` |
| POST | `/public/quotes` | `X-API-KEY` |
| POST | `/admin/auth/login` | público |
| GET, POST | `/admin/projects` | JWT |
| PUT | `/admin/projects/:id` | JWT |
| DELETE | `/admin/projects/:id` | JWT (inativa; `?hard=true` exclui e exige SUPER_ADMIN) |
| GET | `/admin/quotes?status&page&limit` | JWT |
| PATCH | `/admin/quotes/:id/status` | JWT |

Respostas: `{ success: true, data, meta? }` ou `{ success: false, error, details? }`.

```bash
curl -H "X-API-KEY: $PUBLIC_API_KEY" "http://localhost:3333/api/v1/public/projects?isPreset=true"

curl -X POST http://localhost:3333/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"voce@genesis.com","password":"senha-forte-123"}'
```
