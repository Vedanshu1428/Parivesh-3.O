# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy lockfiles and workspace package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY shared/ ./shared/

# Install all workspace dependencies
RUN npm install

COPY frontend/ ./frontend/

RUN cd frontend && npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
