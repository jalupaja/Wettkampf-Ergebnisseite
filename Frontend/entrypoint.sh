#!/bin/sh
: "${VITE_API_URL:=http://backend:3001}"
: "${CORS_ORIGIN:=${VITE_API_URL}}"

# Create or update config.js at runtime
cat > /usr/share/nginx/html/config.js << EOF
window.RUNTIME_CONFIG = {
  VITE_API_URL: "${VITE_API_URL}"
};
EOF

echo "Frontend config initialized with VITE_API_URL=${VITE_API_URL}"

exec "$@"
