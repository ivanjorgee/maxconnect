# Maxconect Crm (Next.js 14)

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma/PostgreSQL.

## Comandos
- `npm install` — instala dependências
- `npm run prisma:migrate` — aplica migrações no Postgres definido em `DATABASE_URL` (dev)
- `npm run prisma:deploy` — aplica migrações em produção (Render/CI)
- `npm run dev` — sobe o app em modo dev
- `npm run dev:clean` — limpa cache do Next e sobe o dev server
- Opcional: `npm run prisma:generate` para gerar o client do Prisma
- Opcional: `node prisma/import-csv.js ./caminho/clinicas.csv` (ou `CSV_PATH=./clinicas.csv node prisma/import-csv.js`) para importar um CSV simples

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e ajuste:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maxconect"
NEXT_PUBLIC_APP_NAME="Maxconect Crm"
AUTH_ALLOWED_EMAILS="seu@email.com" # lista separada por vírgula
AUTH_DEFAULT_EMAIL="admin@maxconect.local"
AUTH_DEFAULT_USER="Administrador"
AUTH_PASSWORD="senha-em-texto-ou-deixe-vazia-se-usar-hash"
AUTH_PASSWORD_HASH="$2a$10$..."      # opcional, prioridade sobre AUTH_PASSWORD
AUTH_JWT_SECRET="chave-longae-unica"
AUTH_DEV_BYPASS="false"
CRON_SECRET="chave-para-o-cron"
```
> Lembre de reiniciar `npm run dev` depois de criar/alterar o `.env.local`.

## Autenticação
- Protegido por JWT via middleware. Use `/auth/login` para entrar; APIs e páginas SSR só respondem autenticadas.
- O primeiro usuário é criado a partir de `AUTH_DEFAULT_EMAIL` + `AUTH_PASSWORD` (ou `AUTH_PASSWORD_HASH`). Depois disso, altere email/senha em `/settings` (API `/api/auth/profile`).
- Opcional: `AUTH_ALLOWED_EMAILS` para restringir quais emails podem logar. `AUTH_DEV_BYPASS` vem desativado por padrão.
- Logout: `POST /api/auth/logout`.

## Estrutura
- `app/` — páginas e route handlers (`app/api/*`)
- `components/` — UI compartilhada (tabelas, formulários, layout)
- `lib/` — Prisma client e helpers (seed desativado)
- `prisma/schema.prisma` — modelos User (opcional), Empresa e Interacao com enums do funil (origem, canal, status, modelo de abertura, ticket, prioridade, tipo de site)

## Seed rápido
Seed automático foi desativado para evitar sobrescrever dados reais. Use suas tabelas existentes no Postgres.

## CSV (opcional)
`prisma/import-csv.js` lê um CSV simples com cabeçalhos: `nome,endereco,cidade,telefone,whatsapp,website,avaliacaoGoogle,qtdAvaliacoes,linkGoogleMaps,origemLead,canalPrincipal,tipoSite`.
