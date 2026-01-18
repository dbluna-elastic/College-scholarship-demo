#!/bin/sh
# Docker entrypoint script to inject environment variables

# Inject environment variables into HTML for client-side access
# This creates window.env object that getEnvVar() can read
if [ -f /usr/share/nginx/html/index.html ]; then
    # Create a script tag that sets window.env
    ENV_SCRIPT="<script>window.env={"
    
    # Add ELASTIC_ES_URL if set
    if [ -n "$ELASTIC_ES_URL" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_ES_URL:'$ELASTIC_ES_URL',"
    fi
    
    # Add ELASTIC_KB_URL if set
    if [ -n "$ELASTIC_KB_URL" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_KB_URL:'$ELASTIC_KB_URL',"
    fi
    
    # Add ELASTIC_AGENT_ID if set
    if [ -n "$ELASTIC_AGENT_ID" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_AGENT_ID:'$ELASTIC_AGENT_ID',"
    fi
    
    # Add ELASTIC_API_KEY if set (required for API calls)
    # Note: This is injected into the page, so ensure proper security measures
    if [ -n "$ELASTIC_API_KEY" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_API_KEY:'$ELASTIC_API_KEY',"
    fi
    
    # Close the object
    ENV_SCRIPT="${ENV_SCRIPT}};</script>"
    
    # Inject before closing </head> tag
    sed -i "s|</head>|${ENV_SCRIPT}</head>|" /usr/share/nginx/html/index.html
fi

# Substitute environment variables in nginx.conf
# Use default values from vite.config.js if not set
export ELASTIC_ES_URL=${ELASTIC_ES_URL:-https://apex-dec2025-group4-b01431.es.us-central1.gcp.elastic.cloud}
export ELASTIC_KB_URL=${ELASTIC_KB_URL:-https://apex-dec2025-group4-b01431.kb.us-central1.gcp.elastic.cloud}

# Extract hostnames from URLs for Host header (remove https:// prefix)
export ELASTIC_ES_HOST=${ELASTIC_ES_URL#https://}
export ELASTIC_KB_HOST=${ELASTIC_KB_URL#https://}

# Use envsubst to replace variables in nginx.conf
envsubst '${ELASTIC_ES_URL} ${ELASTIC_KB_URL} ${ELASTIC_ES_HOST} ${ELASTIC_KB_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Configure and start Elastic Agent if API key is provided
if [ -n "$ELASTIC_AGENT_API_KEY" ] && [ -d "/opt/elastic-agent" ]; then
    cd /opt/elastic-agent
    
    # Set default OTLP endpoint if not provided
    export ELASTIC_OTLP_ENDPOINT=${ELASTIC_OTLP_ENDPOINT:-https://gawdzilla-0d3e9e.ingest.us-east-2.aws.elastic-cloud.com:443}
    
    # Remove existing otel.yml if present
    rm -f ./otel.yml
    
    # Copy the managed OTLP configuration template
    if [ -f "./otel_samples/managed_otlp/platformlogs_hostmetrics.yml" ]; then
        cp ./otel_samples/managed_otlp/platformlogs_hostmetrics.yml ./otel.yml
        
        # Create data directory
        mkdir -p ./data/otelcol
        
        # Replace environment variable placeholders in otel.yml
        STORAGE_DIR="/opt/elastic-agent/data/otelcol"
        sed -i "s#\${env:STORAGE_DIR}#${STORAGE_DIR}#g" ./otel.yml
        sed -i "s#\${env:ELASTIC_OTLP_ENDPOINT}#${ELASTIC_OTLP_ENDPOINT}#g" ./otel.yml
        sed -i "s#\${env:ELASTIC_API_KEY}#${ELASTIC_AGENT_API_KEY}#g" ./otel.yml
        
        # Start Elastic Agent in the background
        echo "Starting Elastic Agent..."
        nohup ./elastic-agent run > /var/log/elastic-agent.log 2>&1 &
        echo $! > /var/run/elastic-agent.pid
        echo "Elastic Agent started with PID $(cat /var/run/elastic-agent.pid)"
    else
        echo "Warning: Elastic Agent OTLP configuration template not found, skipping agent startup"
    fi
else
    if [ -z "$ELASTIC_AGENT_API_KEY" ]; then
        echo "ELASTIC_AGENT_API_KEY not set, skipping Elastic Agent startup"
    fi
fi

# Start nginx
exec nginx -g "daemon off;"
