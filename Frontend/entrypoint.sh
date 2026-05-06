#!/bin/sh
: "${VITE_API_URL:=http://backend:3001}"

# Replace placeholder with env var at runtime
sed -i "s|<VITE_API_URL>|${VITE_API_URL}|" /usr/share/nginx/html/config.js

exec "$@"
