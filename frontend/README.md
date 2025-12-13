# MaximosConect CRM (Next.js 14)

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma/PostgreSQL.

## Comandos
- `npm install` — instala dependências
- `npx prisma migrate dev` — aplica migrações no Postgres definido em `DATABASE_URL`
- `npm run dev` — sobe o app em modo dev
- Opcional: `npm run prisma:generate` para gerar o client do Prisma
- Opcional: `node prisma/import-csv.js ./caminho/clinicas.csv` (ou `CSV_PATH=./clinicas.csv node prisma/import-csv.js`) para importar um CSV simples

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e ajuste:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maximosconect"
NEXT_PUBLIC_APP_NAME="MaximosConect"
AUTH_ALLOWED_EMAILS="seu@email.com" # lista separada por vírgula
AUTH_PASSWORD="senha-em-texto-ou-deixe-vazia-se-usar-hash"
AUTH_PASSWORD_HASH="$2a$10$..."      # opcional, prioridade sobre AUTH_PASSWORD
AUTH_JWT_SECRET="chave-longae-unica"
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
