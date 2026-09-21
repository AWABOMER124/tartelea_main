# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite variables are compiled into the frontend bundle at build time.
# Dokploy must provide these as Docker build arguments.
ARG VITE_BACKEND_API_BASE_URL
ARG VITE_LIVEKIT_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE=
ARG VITE_USE_BACKEND_COMMUNITY=true

ENV VITE_BACKEND_API_BASE_URL=$VITE_BACKEND_API_BASE_URL
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE=$VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE
ENV VITE_USE_BACKEND_COMMUNITY=$VITE_USE_BACKEND_COMMUNITY

RUN npm run check:deploy-env
RUN npm run build

# Stage 2: Serve the static SPA with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
