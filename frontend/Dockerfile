FROM node:20-alpine AS builder

WORKDIR /app

# Add build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
# Use node directly to run vite
RUN node ./node_modules/vite/bin/vite.js build

# Fix permissions for OpenShift
RUN chmod -R 777 /app

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for OpenShift
RUN chmod -R 777 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
