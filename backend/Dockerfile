FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install --immutable

COPY . .

RUN yarn build

EXPOSE 3333

CMD ["sh", "-c", "yarn prisma db update && node dist/server.js"]
