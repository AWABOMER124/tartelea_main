# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite environment variables are injected at build time.
# Dokploy should set these as Docker build arguments (or environment mapped to build args).
ARG VITE_BACKEND_API_BASE_URL=/api/v1
ARG VITE_LIVEKIT_URL=
ARG VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE=
ARG VITE_USE_BACKEND_COMMUNITY=true

ENV VITE_BACKEND_API_BASE_URL=$VITE_BACKEND_API_BASE_URL
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL
ENV VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE=$VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE
ENV VITE_USE_BACKEND_COMMUNITY=$VITE_USE_BACKEND_COMMUNITY

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy build artifacts to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
