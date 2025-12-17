# Maxconect Crm

CRM de prospeccao com Next.js + Prisma (Postgres). O backend antigo em Express e o Vite legacy foram removidos para manter uma unica stack.

Nota: o campo `ownerId` permanece no schema para futura evolucao multiusuario, mas o app opera como single-user hoje.

## Requisitos

- Node.js 20 LTS (ou 18)
- Postgres 13+

## Setup rapido

1) Instale dependencias:

```bash
cd frontend
npm install
```

2) Configure as variaveis de ambiente:

```bash
cp .env.example .env.local
```

3) Gere o client e rode as migracoes:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4) Rode o app:

```bash
npm run dev
```

## Variaveis principais

- `DATABASE_URL`: conexao Postgres.
- `AUTH_DEFAULT_EMAIL` / `AUTH_DEFAULT_USER`: usuario inicial.
- `AUTH_PASSWORD` ou `AUTH_PASSWORD_HASH`: senha inicial (hash bcrypt).
- `AUTH_JWT_SECRET`: chave para assinatura dos tokens.
- `AUTH_DEV_BYPASS`: use `true` apenas em dev local.
- `CRON_SECRET`: protege o endpoint de cron.

## Migracoes em producao

Use o deploy de migracoes:

```bash
npm run prisma:deploy
```

## Deploy no Render

Use o `render.yaml` na raiz para criar o servico automaticamente (rootDir em `frontend`).

Variaveis recomendadas no Render:

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_DEFAULT_EMAIL` / `AUTH_DEFAULT_USER`
- `AUTH_PASSWORD` ou `AUTH_PASSWORD_HASH`
- `AUTH_ALLOWED_EMAILS`
- `AUTH_DEV_BYPASS=false`
- `CRON_SECRET`

### Migracao de dados (mantem as informacoes atuais)

Exporte o banco local e restaure no Postgres do Render:

```bash
pg_dump --no-owner --no-privileges --format=custom "$LOCAL_DATABASE_URL" > backup.dump
pg_restore --no-owner --no-privileges --dbname "$RENDER_DATABASE_URL" backup.dump
```

Se o banco remoto ja tiver tabelas, limpe antes ou use um banco novo para evitar conflitos.
Depois, rode `npm run prisma:deploy` (o start do Render ja faz isso) para aplicar novos indices.

## Cron de follow-ups

O job e idempotente e pode ser chamado por scheduler externo (cron do sistema, Vercel Cron, etc).

```bash
curl -X POST \
  -H "x-cron-secret: SEU_SEGREDO" \
  http://localhost:3000/api/cron/followups
```

## Testes

```bash
npm test
```
