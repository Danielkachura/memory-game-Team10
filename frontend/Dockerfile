# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /frontend

# Copy shared modules first (better layer caching)
COPY modules/ ./modules/

# Install dependencies
COPY app/package.json app/package-lock.json ./app/
RUN cd app && npm ci

# Copy source and build
COPY app/ ./app/
RUN cd app && npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /frontend/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
