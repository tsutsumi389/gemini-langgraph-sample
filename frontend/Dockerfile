FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm \
    PATH="/pnpm:$PATH" \
    CI=true

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts \
    || pnpm install --ignore-scripts

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
