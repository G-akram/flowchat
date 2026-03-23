FROM node:20-alpine AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@flowchat/server...

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy entire workspace minus web app (web is on Vercel)
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server

WORKDIR /app/apps/server
EXPOSE 4000
CMD ["node", "apps/server/dist/server.js"]
