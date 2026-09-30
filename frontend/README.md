# Cinevo Frontend

Interface React do Cinevo para descoberta pública de filmes, escolha de sessão e assentos, reserva temporária, pagamento simulado e ingresso digital.

## Requisitos

- Node.js 24
- Yarn 4
- API do Cinevo em `http://localhost:3334` quando executada pelo Docker Compose

## Desenvolvimento local

```bash
yarn install
yarn dev
```

O Vite abre em `http://localhost:5173`. Durante o desenvolvimento, chamadas para `/api` são encaminhadas à API local pelo proxy configurado em `vite.config.ts`.

Para experimentar todo o fluxo, prepare a API primeiro:

```bash
cd ../backend
yarn seed
yarn dev
```

Ao reservar, use a conta de demonstração `cliente@cinevo.local` com a senha `Cinevo#123`.

## Ambiente de produção

O Dockerfile entrega o build estático com Nginx. O Nginx encaminha `/api` para o serviço `api` do Docker Compose e devolve `index.html` para as rotas do cliente, permitindo acessar diretamente URLs como `/filmes/1` ou `/ingressos`.

Para subir a aplicação completa pelo repositório raiz:

```bash
docker compose up -d --build
```

O frontend ficará em `http://localhost:8081`.

Crie `.env` com a URL pública da API:

```env
VITE_API_URL="https://api.exemplo.com"
```

Sem essa variável, o frontend usa `/api`, apropriado ao proxy do Vite.

## Estrutura

```text
src/
├── App.tsx                 # Estados e orquestração do fluxo do cliente
├── App.css                 # Interface responsiva e acessível
├── catalog.ts              # Tipos, dados de demonstração e formatadores do catálogo
├── components/             # Componentes visuais reutilizáveis
└── services/catalog-api.ts # Cliente HTTP tipado da API Cinevo
```

O catálogo de demonstração só é mostrado quando a API não está disponível. Com a API ativa, filmes, cinemas, sessões e assentos vêm do backend.

## Qualidade

```bash
yarn lint
yarn tsc --noEmit
yarn build
```

O build de produção é gerado em `dist/`.
