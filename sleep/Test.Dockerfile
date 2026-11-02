FROM node:22-alpine
WORKDIR /app
ENV PORT=80 DATA_DIR=/data STATIC_DIR=/app
COPY server/app-server.js /app/app-server.js
CMD ["node", "/app/app-server.js"]
