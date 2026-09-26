# Cinevo

Plataforma full stack para venda e gestão de ingressos de cinema. O projeto foi construído para demonstrar regras de negócio que vão além de um CRUD, principalmente concorrência na venda de assentos, reserva temporária, autorização por papel e ciclo de vida do ingresso.

## Destaques técnicos

- Assentos são físicos, mas a disponibilidade pertence à combinação `Session + Seat`.
- Um `SeatHold` reserva o assento por 10 minutos durante o checkout.
- O banco impede dois holds simultâneos para o mesmo assento e sessão.
- Tickets ativos ou utilizados têm um índice único parcial por sessão e assento. Tickets cancelados ficam no histórico e liberam o assento para revenda.
- Pagamento simulado cria tickets, remove holds e atualiza o pedido em uma transação.
- O preço do ticket é uma fotografia do valor praticado: vem de `Session.price`, é salvo no hold e depois no ticket.
- QR Code usa o código único do ticket. A primeira validação transforma o ticket em `USED`; leituras posteriores são rejeitadas.

## Stack

- Node.js 24, TypeScript e Express
- PostgreSQL 17 em Docker
- Prisma ORM 8 (`@prisma/orm-postgres`)
- Zod, bcrypt, jsonwebtoken e qrcode
- Vitest e Supertest para testes de integração
- React, TypeScript e Vite no frontend

## Arquitetura

```text
HTTP request
  → routes
  → authentication / authorization / validation middlewares
  → controllers
  → services (regras de negócio)
  → Prisma ORM 8
  → PostgreSQL
```

O contrato do banco está em [`backend/src/prisma/contract.prisma`](backend/src/prisma/contract.prisma). Os arquivos `contract.json` e `contract.d.ts` são gerados, nunca editados manualmente.

## Fluxo de compra

```text
AVAILABLE
  → POST /orders
  → PENDING + SeatHold (10 min)
  → POST /orders/:id/pay
  → PAID + ACTIVE Ticket

SeatHold expirado
  → EXPIRED + assento disponível

POST /orders/:id/cancel (até 2h antes da sessão)
  → CANCELLED Order + CANCELLED Ticket + assento disponível

POST /tickets/validate
  → USED Ticket
```

O serviço de expiração roda quando a API inicia, a cada minuto e antes de operações críticas de consulta, criação de pedido e pagamento.

## Papéis e permissões

| Papel | Acesso principal |
| --- | --- |
| `CUSTOMER` | catálogo, sessões, assentos, pedidos, tickets, QR Code e cancelamento próprio |
| `CINEMA_ADMIN` | salas, assentos, sessões e validação de tickets do cinema ao qual está vinculado |
| `PLATFORM_ADMIN` | cinemas, filmes, usuários, vínculo de administradores e validação de qualquer ticket |

Um administrador de cinema é vinculado por `CinemaAdmin`. A plataforma usa:

```http
POST /cinemas/:cinemaId/admins
Authorization: Bearer <platform-token>

{ "userId": 123 }
```

Novos usuários se registram como `CUSTOMER`. O primeiro `PLATFORM_ADMIN` precisa ser promovido por um procedimento controlado de bootstrap no banco, pois não há endpoint público para elevar privilégios.

## API atual

O contrato em OpenAPI 3.1 está em [`backend/openapi.yaml`](backend/openapi.yaml). Ele pode ser importado no Swagger UI, Postman ou Insomnia.

### Público

```http
GET  /health
GET  /movies
GET  /cinemas
GET  /rooms
GET  /rooms/:roomId/seats
GET  /sessions
GET  /sessions/:id
GET  /sessions/:sessionId/seats
POST /users
POST /auth/login
GET  /auth/me
```

### Cliente autenticado

```http
POST /orders
POST /orders/:id/pay
POST /orders/:id/cancel
GET  /orders
GET  /orders/:id
GET  /tickets
GET  /tickets/:code/qrcode
GET  /favorites
POST /favorites/:movieId
DELETE /favorites/:movieId
```

### Administração

```http
GET  /admin/dashboard                    # PLATFORM_ADMIN
POST /cinemas                         # PLATFORM_ADMIN
POST /cinemas/:cinemaId/admins         # PLATFORM_ADMIN
POST /movies                           # PLATFORM_ADMIN
GET  /users                            # PLATFORM_ADMIN
POST /rooms                            # CINEMA_ADMIN vinculado ou PLATFORM_ADMIN
POST /rooms/:roomId/seats              # CINEMA_ADMIN vinculado ou PLATFORM_ADMIN
POST /sessions                         # CINEMA_ADMIN vinculado ou PLATFORM_ADMIN
POST /tickets/validate                 # CINEMA_ADMIN vinculado ou PLATFORM_ADMIN
```

## Configuração local

Suba a API e o PostgreSQL:

```bash
docker compose up -d
```

A API ficará em `http://localhost:3333`. O container aplica atualizações aditivas do contrato Prisma antes de iniciar.

Crie `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL="postgresql://cinevo:cinevo@localhost:5433/cinevo"
JWT_SECRET="cinevo-development-secret-change-me"
```

Instale dependências e atualize o contrato:

```bash
cd backend
yarn install
yarn prisma contract emit
yarn prisma db update
```

Execute a API:

```bash
yarn dev
```

### Dados de demonstração

Com o banco atualizado, preencha o ambiente local com cinemas, salas, assentos, filmes e sessões futuras:

```bash
cd backend
yarn seed
```

A seed é segura para repetir no mesmo dia. Use uma destas contas no frontend ou na API:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `cliente@cinevo.local` | `Cinevo#123` |
| Administrador da plataforma | `admin@cinevo.local` | `Cinevo#123` |
| Administrador do Cinevo Paulista | `gerente@cinevo.local` | `Cinevo#123` |

Se preferir executar a API fora do Docker, a API estará em `http://localhost:3333`.

## Frontend

O frontend fica em [`frontend`](frontend) e foi construído a partir dos protótipos do Cinevo. Ele mantém a descoberta de filmes pública e só solicita identificação quando o cliente tenta reservar os assentos.

```bash
cd frontend
yarn install
yarn dev
```

O Vite abre em `http://localhost:5173` e encaminha chamadas feitas para `/api` à API local em `http://localhost:3333`. Para publicar o frontend em uma origem diferente, configure:

```env
# backend/.env
FRONTEND_ORIGIN="https://seu-frontend.example"

# frontend/.env
VITE_API_URL="https://sua-api.example"
```

O fluxo disponível é:

```text
Catálogo público
  → cinema e horário
  → assentos disponíveis
  → login ou cadastro
  → reserva temporária
  → pagamento simulado
  → ingresso com QR Code
  → histórico, perfil e cancelamento elegível
```

## Testes

Os testes de integração usam um banco isolado chamado `cinevo_test`. Crie-o uma vez:

```bash
docker exec cinevo-postgres createdb -U cinevo cinevo_test
```

Depois aplique o contrato e execute a suíte:

```bash
cd backend
DATABASE_URL="postgresql://cinevo:cinevo@localhost:5433/cinevo_test" yarn prisma db update
DATABASE_URL_TEST="postgresql://cinevo:cinevo@localhost:5433/cinevo_test" yarn test
```

A suíte cobre:

- pagamento e prevenção de venda duplicada;
- expiração de hold e liberação do assento;
- validação única de ingresso por administrador vinculado ao cinema.

## Integração contínua

O workflow [CI](.github/workflows/ci.yml) executa em pushes para `main` e em pull requests. Ele sobe um PostgreSQL efêmero, aplica o contrato no banco de testes, valida o TypeScript, executa os testes de integração e constrói o frontend.

## Próximos passos

- documentação OpenAPI e tratamento centralizado de erros;
- dashboard administrativo e métricas de venda;
- favoritos persistentes e preferências de cliente;
- deploy em ambiente público.
