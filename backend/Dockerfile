# Build stage
FROM node:20-alpine AS build

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy lockfiles and workspace package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY shared/ ./shared/

# Install all workspace dependencies
RUN npm install

COPY backend/ ./backend/

RUN cd backend && npx prisma generate
RUN cd backend && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
