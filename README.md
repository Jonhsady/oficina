# Oficina

Painel de ordens de serviço para uma assistência técnica. O técnico abre uma ordem, anexa a foto do defeito e só avança o status por transições válidas. Outra pessoa olhando a bancada vê a mudança na hora, sem atualizar a página.

Este repositório é um projeto de portfólio. O código da Redgtech não entra aqui.

## Stack

- API: NestJS, TypeScript, PostgreSQL, Prisma, Argon2, JWT com refresh rotativo, Socket.IO
- Arquivos: disco local no desenvolvimento, MinIO (S3) no Docker Compose
- Painel: Next.js
- Testes: Jest na máquina de estados e um fluxo HTTP de ponta a ponta
- CI: GitHub Actions executa lint, testes e build

## Como rodar

Pré-requisitos: Node 20+ e Docker.

```bash
docker compose up -d postgres
cd api
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Em outro terminal:

```bash
cd web
npm install
npm run dev
```

- Painel: http://localhost:3001
- API: http://localhost:3000/api/v1/health
- OpenAPI: http://localhost:3000/api/docs

Contas de demonstração, senha `oficina123`:

- `bruno.tecnico@oficina.local`
- `ana.admin@oficina.local`

Para subir API, Postgres e MinIO juntos:

```bash
docker compose up --build
```

Nesse modo a API usa MinIO. O painel continua com `npm run dev` na pasta `web`.

## O que os testes cobrem

- Transições válidas e inválidas da ordem, sem banco.
- Fluxo HTTP: login, ordem com equipamento de outro cliente, salto de status recusado, diagnóstico aceito, refresh token usado uma segunda vez recusado, upload e leitura da foto.

```bash
cd api
npm test
npm run test:e2e
```

O e2e precisa do Postgres no ar (`docker compose up -d postgres` e `npx prisma migrate deploy`).

## Decisões

A ordem é uma máquina de estados no servidor, não uma lista solta na tela. O painel recebe `allowedTransitions` e não reinventa a regra. Detalhe em [docs/adr/001-status-da-ordem.md](docs/adr/001-status-da-ordem.md).

O refresh token é guardado como hash. Cada uso revoga o token anterior e emite outro. Se o mesmo token aparecer de novo, a API recusa a sessão.

Senha com Argon2id. Usuário inexistente ainda passa por uma verificação para não responder mais rápido do que uma senha errada.

A primeira transição grava o técnico como responsável. Foto passa pela API com o token, em vez de um bucket público.

## Fora desta versão

Pagamento, multi-tenant, aplicativo nativo e Kubernetes. Cancelar uma ordem também fica de fora até existir uma transição explícita para isso.
