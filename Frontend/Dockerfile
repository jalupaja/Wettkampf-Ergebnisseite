FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Vite preview defaults to port 4173
EXPOSE 4173

# Use --host to bind to 0.0.0.0 for external access
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]