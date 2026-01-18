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

# Configure and start OpenTelemetry Collector if API key is provided
if [ -n "$ELASTIC_OTLP_API_KEY" ] && [ -f "/opt/otelcol/otelcol-contrib" ]; then
    # Set default OTLP endpoint if not provided
    # OTLP HTTP exporter automatically appends /v1/metrics, so use base URL only
    export ELASTIC_OTLP_ENDPOINT=${ELASTIC_OTLP_ENDPOINT:-https://gawdzilla-0d3e9e.ingest.us-east-2.aws.elastic-cloud.com:443}
    
    # Remove any trailing paths - OTLP exporter handles paths automatically
    OTLP_ENDPOINT="${ELASTIC_OTLP_ENDPOINT%%/*}"
    if [ "${ELASTIC_OTLP_ENDPOINT#*://}" != "${ELASTIC_OTLP_ENDPOINT}" ]; then
        # Has protocol, extract host:port
        OTLP_ENDPOINT="${ELASTIC_OTLP_ENDPOINT#*://}"
        OTLP_ENDPOINT="${OTLP_ENDPOINT%%/*}"
        OTLP_ENDPOINT="${ELASTIC_OTLP_ENDPOINT%%://*}//${OTLP_ENDPOINT}"
    fi
    
    # Create otel config directory
    mkdir -p /opt/otelcol/config
    
    # Create OpenTelemetry Collector configuration
    cat > /opt/otelcol/config/otel.yml <<EOF
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  hostmetrics:
    collection_interval: 10s
    scrapers:
      cpu:
      memory:
      disk:
      network:

processors:
  resourcedetection:
    detectors: [env, system]
  batch:
    timeout: 5s
    send_batch_size: 1000

exporters:
  otlphttp:
    endpoint: ${ELASTIC_OTLP_ENDPOINT}
    headers:
      Authorization: "ApiKey ${ELASTIC_OTLP_API_KEY}"
    tls:
      insecure: false
    compression: gzip

service:
  telemetry:
    logs:
      level: debug
  pipelines:
    metrics:
      receivers: [otlp, hostmetrics]
      processors: [resourcedetection, batch]
      exporters: [otlphttp]
EOF
    
    # Validate configuration before starting
    echo "Validating OpenTelemetry Collector configuration..."
    if /opt/otelcol/otelcol-contrib --config=config/otel.yml --dry-run 2>&1 | head -5; then
        echo "Configuration is valid"
    else
        echo "Warning: Configuration validation had issues, but continuing..."
    fi
    
    # Start OpenTelemetry Collector in the background
    echo "Starting OpenTelemetry Collector..."
    echo "Endpoint: ${OTLP_ENDPOINT}"
    cd /opt/otelcol
    mkdir -p /var/log
    nohup ./otelcol-contrib --config=config/otel.yml > /var/log/otelcol.log 2>&1 &
    COLLECTOR_PID=$!
    echo $COLLECTOR_PID > /var/run/otelcol.pid
    echo "OpenTelemetry Collector started with PID $COLLECTOR_PID"
    
    # Wait a moment and check if it's still running
    sleep 2
    if kill -0 $COLLECTOR_PID 2>/dev/null; then
        echo "OpenTelemetry Collector is running"
    else
        echo "Warning: OpenTelemetry Collector may have failed to start. Check /var/log/otelcol.log"
        tail -20 /var/log/otelcol.log 2>/dev/null || echo "No log file found"
    fi
else
    if [ -z "$ELASTIC_OTLP_API_KEY" ]; then
        echo "ELASTIC_OTLP_API_KEY not set, skipping OpenTelemetry Collector startup"
    elif [ ! -f "/opt/otelcol/otelcol-contrib" ]; then
        echo "OpenTelemetry Collector binary not found at /opt/otelcol/otelcol-contrib"
    fi
fi

# Start nginx
exec nginx -g "daemon off;"
