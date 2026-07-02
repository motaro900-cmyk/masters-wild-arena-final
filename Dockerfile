# Use official lightweight Node.js 24 image
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite build)
RUN npm ci

# Copy codebase
COPY . .

# Run assets optimization and Vite production build
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --production

# Final runtime stage
FROM node:24-alpine

WORKDIR /app

# Copy built application and production dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Install Express and related dependencies specifically for VPS runtime
# (they are not in the main package.json to prevent bloating the Vercel serverless deployment)
RUN npm install express cors dotenv

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "server/vps-server.js"]
