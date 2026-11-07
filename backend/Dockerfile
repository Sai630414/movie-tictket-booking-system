
FROM node:22-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY . .

# Production environment
ENV NODE_ENV=production

# Express backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
