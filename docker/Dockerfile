# Build the Vite application with the repository's locked pnpm dependencies.
FROM ps-docker-registry.cn-beijing.cr.aliyuncs.com/psdsframework/node:22 AS builder

USER root
WORKDIR /app

RUN corepack enable
ENV CI=true
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Serve the static SPA and proxy API traffic at runtime.
FROM ps-docker-registry.cn-beijing.cr.aliyuncs.com/psdsframework/openresty:latest

COPY docker/nginx.conf /etc/nginx/nginx.conf.tmpl
COPY --from=builder /app/dist /usr/local/openresty/nginx/html

ENV API_URL="http://10.2.1.16:32096"
ENV VELA_API_URL="http://10.2.1.16:31119"

COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
