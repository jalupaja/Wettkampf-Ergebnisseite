FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Expose port (backend runs on 3001 by default, check server.js)
EXPOSE 3001

# Start the backend
CMD ["npm", "start"]
