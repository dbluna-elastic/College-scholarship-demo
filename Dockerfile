# Stage 1: Build the application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the app (Vite generates the /dist folder)
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Install gettext for envsubst and curl/tar for OpenTelemetry Collector
RUN apk add --no-cache gettext curl tar

# Install OpenTelemetry Collector (EDOT - Elastic Distribution)
WORKDIR /opt
RUN ARCH=$(if [ "$(uname -m)" = "arm" ] || [ "$(uname -m)" = "aarch64" ]; then echo "arm64"; else echo "$(uname -m)"; fi) && \
    curl --output otelcol-contrib_linux_${ARCH}.tar.gz \
         --url https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.112.0/otelcol-contrib_0.112.0_linux_${ARCH}.tar.gz \
         --proto '=https' --tlsv1.2 -fL && \
    mkdir -p /opt/otelcol && \
    tar -xvf otelcol-contrib_linux_${ARCH}.tar.gz -C /opt/otelcol && \
    rm -f otelcol-contrib_linux_${ARCH}.tar.gz && \
    chmod +x /opt/otelcol/otelcol-contrib && \
    mkdir -p /opt/otelcol/data

# Copy the built files from Stage 1
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .

# Copy nginx config as template (will be processed by envsubst)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
