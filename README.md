# 🎬 Cinevo [Em desenvolvimento]

Plataforma full stack para gestão de cinemas e venda de ingressos online.

O Cinevo permite que clientes descubram filmes, consultem sessões, escolham seus assentos e realizem compras de ingressos digitais. Para os cinemas, a plataforma oferece recursos para gerenciamento de filmes, salas, assentos, sessões, vendas e operação do cinema.

---

## ✨ Sobre o projeto

O Cinevo foi desenvolvido com foco em representar os principais desafios de um sistema real de venda de ingressos, indo além de um CRUD tradicional.

A aplicação trabalha com conceitos como:

- controle de disponibilidade de assentos por sessão;
- prevenção de venda duplicada;
- reserva temporária de assentos;
- controle de pedidos e ingressos;
- diferentes perfis de acesso;
- gerenciamento de cinemas, salas e sessões;
- regras de cancelamento;
- emissão de ingressos digitais;
- geração de QR Code;
- validações de dados;
- controle de concorrência;
- persistência relacional com PostgreSQL.

O projeto possui uma arquitetura separando responsabilidades entre API, regras de negócio, persistência e interface.

---

## 🚀 Principais funcionalidades

### 🎥 Catálogo de filmes

- Cadastro de filmes;
- Título;
- Sinopse;
- Duração;
- Classificação indicativa;
- Capa;
- Trailer;
- Consulta de filmes;
- Consulta de detalhes;
- Edição e remoção.

### 🏢 Gestão de cinemas

- Cadastro de cinemas;
- Endereço;
- Cidade e estado;
- Administradores associados;
- Gerenciamento das salas.

### 🎟️ Gestão de salas

- Cadastro de salas;
- Identificação por número;
- Salas padrão e VIP;
- Configuração da capacidade;
- Geração dos assentos;
- Assentos padrão, VIP e acessíveis.

### 🪑 Gestão de assentos

- Configuração da planta da sala;
- Geração automática dos assentos;
- Identificação por fileira e número;
- Assentos acessíveis;
- Disponibilidade controlada por sessão.

A disponibilidade não pertence ao assento físico.

Um mesmo assento pode estar disponível em uma sessão e vendido em outra.

### 🕐 Gestão de sessões

- Associação entre filme e sala;
- Data e horário de início;
- Data e horário de término;
- Consulta de sessões;
- Prevenção de conflitos de horário na mesma sala.

Exemplo:

Sala 1

18:00 ───────── 20:00
20:00 ───────── 22:00
é permitido.
Já:
Sala 1

18:00 ───────── 20:00
19:30 ───────── 21:30
é bloqueado.

### 💺 Seleção de assentos
Durante a compra, o cliente visualiza os assentos disponíveis para uma sessão específica.
Estados considerados:
- disponível;
- reservado temporariamente;
- vendido.
A disponibilidade é determinada pela relação entre sessão, assento e ingressos/reservas.

### 🛒 Pedidos
- Criação de pedido;
- Seleção de ingressos;
- Cálculo do valor total;
- Controle de status;
- Histórico de pedidos;
- Cancelamento conforme as regras da plataforma.
Status:
PENDING
PAID
CANCELLED
EXPIRED

### 🎫 Ingressos
Cada ingresso possui:
- sessão;
- assento;
- tipo;
- preço;
- código único;
- pedido associado.
Tipos:
- inteira;
- meia-entrada.

### 📱 Ingresso digital
Após a confirmação da compra:
- ingresso digital;
- código único;
- QR Code;
- informações da sessão;
- filme;
- cinema;
- sala;
- assento.

### 👤 Autenticação e autorização
A plataforma possui diferentes perfis:
Customer
Pode:
- navegar pelos filmes;
- consultar sessões;
- selecionar assentos;
- comprar ingressos;
- visualizar pedidos;
- acessar ingressos;
- cancelar compras dentro das regras.
Cinema Admin
Pode:
- gerenciar seu cinema;
- gerenciar salas;
- configurar assentos;
- gerenciar sessões;
- consultar vendas.
Platform Admin
Possui acesso administrativo à plataforma.

### 🧠 Regras de negócio
O Cinevo possui regras para representar situações comuns de uma operação real de cinema.
Disponibilidade de assentos
Um assento físico pertence a uma sala:
Sala 1
 └── A01
Porém sua disponibilidade pertence à sessão:
Sessão 1 → A01 vendido
Sessão 2 → A01 disponível
Sessão 3 → A01 vendido
Por isso não existe um campo available diretamente em Seat.
Prevenção de venda duplicada
O banco possui uma restrição para impedir que o mesmo assento seja associado duas vezes à mesma sessão:
(sessionId, seatId)
Isso cria uma segunda camada de proteção além da regra implementada na aplicação.
Reserva temporária
Durante o processo de compra, os assentos podem ficar temporariamente reservados.
Fluxo:
AVAILABLE
    ↓
HELD
    ↓
PAID
Caso o pagamento não seja concluído:
HELD
  ↓
EXPIRED
  ↓
AVAILABLE
Conflito de sessões
Uma sala não pode possuir sessões sobrepostas.
O sistema verifica os intervalos de horário antes de criar uma nova sessão.
Histórico de valores
O preço do ingresso é armazenado no próprio Ticket.
Isso evita que uma alteração futura na tabela de preços altere o valor de uma compra já realizada.

### 🏗️ Arquitetura
O backend utiliza uma arquitetura organizada por responsabilidades:
HTTP Request
     ↓
Routes
     ↓
Middlewares
     ↓
Controllers
     ↓
Services
     ↓
Prisma ORM
     ↓
PostgreSQL
Controllers
Responsáveis pela camada HTTP:
- recebem requisições;
- chamam os serviços;
- retornam respostas.
Services
Concentram as regras de negócio.
Exemplos:
- criação de sessões;
- validação de conflitos;
- geração de assentos;
- processo de compra;
- reserva de assentos.
Schemas
Responsáveis pela validação dos dados recebidos pela API.
Utilizam Zod.
DTOs
Definem os dados utilizados entre as diferentes camadas da aplicação.
Prisma ORM
Responsável pelo acesso tipado ao banco utilizando o Prisma ORM 8.
PostgreSQL
Responsável pela persistência dos dados relacionais.

### 🛠️ Tecnologias
Backend
- Node.js
- TypeScript
- Express
- Prisma ORM 8
- Zod
Banco de dados
- PostgreSQL 17
Frontend
- React
- TypeScript
Infraestrutura
- Docker
- Docker Compose
Ferramentas
- Git
- Yarn
- Zed / VS Code

### 🗂️ Estrutura do projeto
cinevo/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── prisma/
│   │   │   ├── contract.prisma
│   │   │   ├── contract.json
│   │   │   ├── contract.d.ts
│   │   │   └── db.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env
│   ├── prisma.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .yarnrc.yml
│
├── frontend/
│   └── ...
│
├── docker-compose.yml
├── .gitignore
└── README.md

### 🗃️ Modelo de dados
Principais entidades:
User
 │
 ├── Order
 │     └── Ticket
 │
 └── CinemaAdmin
        │
        └── Cinema
              │
              └── Room
                    │
                    └── Seat

Movie
 │
 └── Session
       │
       ├── Room
       └── Ticket
Entidades
Entidade	Responsabilidade
User	Usuários e perfis
Cinema	Cinemas cadastrados
CinemaAdmin	Administradores dos cinemas
Room	Salas de exibição
Seat	Assentos físicos
Movie	Filmes
Session	Exibições dos filmes
Order	Pedidos de compra
Ticket	Ingressos individuais



### 🔌 API
Health
GET /health
Filmes
GET    /movies
POST   /movies
GET    /movies/:id
PATCH  /movies/:id
DELETE /movies/:id
Cinemas
GET  /cinemas
POST /cinemas
Salas
GET  /rooms
POST /rooms
Assentos
GET  /rooms/:roomId/seats
POST /rooms/:roomId/seats
Sessões
GET  /sessions
POST /sessions
GET  /sessions/:id
Pedidos
GET  /orders
GET  /orders/:id
POST /orders
POST /orders/:id/cancel
Ingressos
GET /tickets/:id

### 🐳 Executando com Docker
O PostgreSQL é executado através do Docker Compose.
docker compose up -d
Verificar o container:
docker ps
O banco utiliza:
Host: localhost
Port: 5433
Database: cinevo
User: cinevo
Password: cinevo

### ⚙️ Configuração
Crie um arquivo .env dentro de backend:
DATABASE_URL="postgresql://cinevo:cinevo@localhost:5433/cinevo"
Instale as dependências:
yarn install

### ▶️ Executando o backend
Modo desenvolvimento:
yarn dev
Build:
yarn build
Produção:
yarn start
API:
http://localhost:3333
Health check:
http://localhost:3333/health

### 🧪 Testes
O projeto possui testes para:
- validação de dados;
- regras de negócio;
- criação de sessões;
- conflitos de horários;
- disponibilidade de assentos;
- criação de pedidos;
- prevenção de venda duplicada;
- cancelamento;
- autenticação e autorização.

### 🔐 Segurança
O backend possui:
- validação de entrada;
- autenticação;
- autorização por perfil;
- senhas armazenadas com hash;
- proteção contra operações inválidas;
- restrições de integridade no banco;
- controle de acesso aos recursos do cinema.

### 📈 Fluxo de compra
O fluxo principal do cliente é:
Descobrir filme
      ↓
Escolher cinema
      ↓
Escolher sessão
      ↓
Visualizar mapa de assentos
      ↓
Selecionar assentos
      ↓
Reservar temporariamente
      ↓
Criar pedido
      ↓
Pagamento
      ↓
Confirmar pedido
      ↓
Emitir ingressos
      ↓
Gerar QR Code

### 🎯 Principais desafios técnicos
O projeto foi estruturado para trabalhar problemas presentes em sistemas reais:
Concorrência
Dois usuários podem tentar comprar o mesmo assento simultaneamente.
A aplicação utiliza regras de negócio e restrições no banco para impedir que uma mesma combinação de sessão e assento seja vendida duas vezes.
Modelagem relacional
A disponibilidade de um assento não pertence ao assento físico, mas ao relacionamento entre:
Sessão + Assento
Integridade
O PostgreSQL também atua como camada de proteção através de:
- foreign keys;
- unique constraints;
- índices;
- relacionamentos.
Regras de negócio
As regras não ficam concentradas nos controllers.
A camada de services centraliza operações como:
- conflitos de sessão;
- reserva;
- compra;
- cancelamento;
- emissão de ingressos.

### 📌 Roadmap funcional
#### Catálogo
- [x] Cadastro de filmes
- [x] Consulta de filmes
- [ ] Validação dos dados
#### Cinemas
- [x] Cadastro de cinemas
- [x] Cadastro de salas
- [ ] Configuração de assentos
#### Sessões
- [x] Cadastro de sessões
- [ ] Validação de horários
- [x] Associação filme/sala
#### Compras
- [ ] Seleção de assentos
- [ ] Reserva temporária
- [ ] Criação de pedidos
- [ ] Controle de status
- [ ] Emissão de ingressos
- [ ] QR Code
#### Usuários
- [ ] Cadastro
- [ ] Login
- [ ] Autorização por perfil
- [ ] Histórico de compras
#### Frontend
- [ ] Catálogo
- [ ] Página de filme
- [ ] Sessões
- [ ] Mapa de assentos
- [ ] Checkout
- [ ] Meus ingressos
- [ ] Área administrativa

### 🔮 Possíveis evoluções
O Cinevo pode posteriormente receber:
- pagamentos reais;
- cupons;
- promoções;
- preços dinâmicos;
- programa de fidelidade;
- notificações por e-mail;
- integração com leitores de QR Code;
- relatórios financeiros;
- dashboard operacional;
- múltiplas formas de pagamento.

### 👩‍💻 Projeto
Cinevo
Plataforma de gestão e venda de ingressos para cinemas.
Desenvolvido como projeto de portfólio com foco em:
- desenvolvimento backend;
- TypeScript;
- APIs REST;
- modelagem relacional;
- regras de negócio;
- PostgreSQL;
- Prisma ORM 8;
- arquitetura de software;
- desenvolvimento full stack.
