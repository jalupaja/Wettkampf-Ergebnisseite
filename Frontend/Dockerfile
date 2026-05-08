FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://backend:3001
ENV VITE_API_URL=$VITE_API_URL

COPY Frontend/package*.json ./

RUN npm ci

COPY ./Frontend .

COPY ./shared ./shared

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY Frontend/entrypoint.sh /entrypoint.sh

# Minimal SPA config: static assets + index fallback for client-side routes
RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf '%s\n' \
    'server {' \
    '  listen 4173;' \
    '  listen [::]:4173;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '' \
    '  location / {' \
    '    try_files $uri $uri/ /index.html;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf

RUN chmod +x /entrypoint.sh

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4173/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]