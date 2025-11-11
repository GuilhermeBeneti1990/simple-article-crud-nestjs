# multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig*.json ./
COPY src ./src
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/dist ./dist
COPY .env ./
RUN npm install --production
EXPOSE 3000
CMD ["sh","-c","node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js && node dist/seed.js && node dist/main.js"]
