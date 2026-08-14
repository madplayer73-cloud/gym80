FROM node:22-alpine AS build

WORKDIR /app

ARG EXPO_PUBLIC_CLOUD_AUTH=off
ENV EXPO_PUBLIC_CLOUD_AUTH=$EXPO_PUBLIC_CLOUD_AUTH

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
