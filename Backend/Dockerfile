FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY Backend/package*.json ./

RUN npm ci --omit=dev

COPY --chown=nodejs:nodejs ./Backend .

COPY --chown=nodejs:nodejs ./shared ./node_modules/shared

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/config', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "--enable-source-maps", "src/server.js"]