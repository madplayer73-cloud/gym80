FROM node:22-alpine AS build

WORKDIR /app

ARG EXPO_PUBLIC_CLOUD_AUTH=off
ENV EXPO_PUBLIC_CLOUD_AUTH=$EXPO_PUBLIC_CLOUD_AUTH

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web

FROM node:22-alpine

WORKDIR /app

ENV PORT=80
ENV STATIC_DIR=/app/public
ENV DATA_DIR=/data

COPY server/app-server.js /app/app-server.js
COPY --from=build /app/dist /app/public

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/sync/health >/dev/null || exit 1

CMD ["node", "/app/app-server.js"]
