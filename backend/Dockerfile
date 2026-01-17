FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force

COPY . .

# Use node directly to run prisma and nest
RUN node ./node_modules/prisma/build/index.js generate
RUN node ./node_modules/@nestjs/cli/bin/nest.js build

# Fix permissions for OpenShift  
RUN chmod -R 777 /app /root

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Fix permissions for OpenShift
RUN chmod -R 777 /app /root

EXPOSE 3000

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && node dist/main"]
