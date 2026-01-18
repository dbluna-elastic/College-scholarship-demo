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

# Install gettext for envsubst and curl/tar for Elastic Agent
RUN apk add --no-cache gettext curl tar

# Create nginx log directory
RUN mkdir -p /var/log/nginx

# Install Elastic Agent
WORKDIR /opt
RUN ARCH=$(if [ "$(uname -m)" = "arm" ] || [ "$(uname -m)" = "aarch64" ]; then echo "arm64"; else echo "$(uname -m)"; fi) && \
    curl --output elastic-agent-9.2.4-linux-${ARCH}.tar.gz \
         --url https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-9.2.4-linux-${ARCH}.tar.gz \
         --proto '=https' --tlsv1.2 -fL && \
    mkdir -p elastic-agent-9.2.4-linux-${ARCH} && \
    tar -xvf elastic-agent-9.2.4-linux-${ARCH}.tar.gz -C elastic-agent-9.2.4-linux-${ARCH} --strip-components=1 && \
    mv elastic-agent-9.2.4-linux-${ARCH} /opt/elastic-agent && \
    rm -f elastic-agent-9.2.4-linux-${ARCH}.tar.gz && \
    mkdir -p /opt/elastic-agent/data

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
