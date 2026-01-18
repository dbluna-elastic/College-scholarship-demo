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
    
    # Add ELASTIC_APM_SERVER_URL if set (for browser APM agent)
    if [ -n "$ELASTIC_APM_SERVER_URL" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_APM_SERVER_URL:'$ELASTIC_APM_SERVER_URL',"
    fi
    
    # Add ELASTIC_APM_API_KEY if set (for browser APM agent authentication)
    if [ -n "$ELASTIC_APM_API_KEY" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_APM_API_KEY:'$ELASTIC_APM_API_KEY',"
    fi
    
    # Add ELASTIC_APM_SECRET_TOKEN if set (alternative to API key)
    if [ -n "$ELASTIC_APM_SECRET_TOKEN" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_APM_SECRET_TOKEN:'$ELASTIC_APM_SECRET_TOKEN',"
    fi
    
    # Add ELASTIC_APM_SERVICE_NAME if set (optional override)
    if [ -n "$ELASTIC_APM_SERVICE_NAME" ]; then
        ENV_SCRIPT="${ENV_SCRIPT}ELASTIC_APM_SERVICE_NAME:'$ELASTIC_APM_SERVICE_NAME',"
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
if [ -n "$ELASTIC_AGENT_API_KEY" ] && [ -f "/opt/elastic-agent/elastic-agent" ]; then
    echo "ELASTIC_AGENT_API_KEY is set, configuring and starting Elastic Agent..."
    
    AGENT_DIR="/opt/elastic-agent"
    AGENT_CONFIG_PATH="${AGENT_DIR}/elastic-agent.yml"
    
    # Set default Fleet URL if not provided (for managed mode)
    # For standalone mode, we'll use direct output configuration
    export ELASTIC_AGENT_FLEET_URL=${ELASTIC_AGENT_FLEET_URL:-""}
    
    # Create Elastic Agent configuration for standalone mode (logs and metrics)
    # This uses filebeat and metricbeat integrations
    cat > "${AGENT_CONFIG_PATH}" <<EOF
outputs:
  default:
    type: elasticsearch
    hosts: ["${ELASTIC_ES_URL:-https://apex-dec2025-group4-b01431.es.us-central1.gcp.elastic.cloud}"]
    api_key: "${ELASTIC_AGENT_API_KEY}"
    ssl.verification_mode: certificate

inputs:
  - type: logfile
    id: nginx-access-logs
    streams:
      - id: nginx-access
        paths:
          - /var/log/nginx/access.log
        processors:
          - add_fields:
              fields:
                log.source: nginx
                service.name: Scholarshipdemo
                log.type: access
  - type: logfile
    id: nginx-error-logs
    streams:
      - id: nginx-error
        paths:
          - /var/log/nginx/error.log
        processors:
          - add_fields:
              fields:
                log.source: nginx
                service.name: Scholarshipdemo
                log.type: error
  - type: system/metrics
    id: system-metrics
    streams:
      - id: cpu
        metricsets: ["cpu"]
        period: 10s
      - id: memory
        metricsets: ["memory"]
        period: 10s
      - id: disk
        metricsets: ["disk"]
        period: 10s
      - id: network
        metricsets: ["network"]
        period: 10s
    processors:
      - add_fields:
          fields:
            service.name: Scholarshipdemo
EOF
    
    # Start Elastic Agent in the background (standalone mode)
    echo "Starting Elastic Agent in standalone mode..."
    # Use absolute path to elastic-agent (resolve symlink)
    AGENT_BINARY="/opt/elastic-agent/elastic-agent"
    if [ ! -f "${AGENT_BINARY}" ]; then
        # Try to find the actual binary if symlink doesn't work
        AGENT_BINARY=$(readlink -f "${AGENT_BINARY}" 2>/dev/null || echo "${AGENT_BINARY}")
    fi
    
    if [ ! -f "${AGENT_BINARY}" ]; then
        echo "Error: Elastic Agent binary not found at ${AGENT_BINARY}"
    else
        mkdir -p /var/log
        nohup "${AGENT_BINARY}" run -c "${AGENT_CONFIG_PATH}" > /var/log/elastic-agent.log 2>&1 &
        AGENT_PID=$!
        echo $AGENT_PID > /var/run/elastic-agent.pid
        echo "Elastic Agent started with PID $AGENT_PID"
        
        # Wait a moment and check if it's still running
        sleep 2
        if kill -0 $AGENT_PID 2>/dev/null; then
            echo "Elastic Agent is running"
        else
            echo "Warning: Elastic Agent may have failed to start. Check /var/log/elastic-agent.log"
            tail -20 /var/log/elastic-agent.log 2>/dev/null || echo "No log file found"
        fi
    fi
else
    if [ -z "$ELASTIC_AGENT_API_KEY" ]; then
        echo "ELASTIC_AGENT_API_KEY not set, skipping Elastic Agent startup"
    elif [ ! -f "/opt/elastic-agent/elastic-agent" ]; then
        echo "Elastic Agent binary not found at /opt/elastic-agent/elastic-agent"
    fi
fi

# Remove nginx log symlinks if they exist (they point to stdout/stderr)
# We need actual files for the filelog receiver
if [ -L /var/log/nginx/access.log ]; then
    rm -f /var/log/nginx/access.log
    touch /var/log/nginx/access.log
fi
if [ -L /var/log/nginx/error.log ]; then
    rm -f /var/log/nginx/error.log
    touch /var/log/nginx/error.log
fi

# Start nginx
exec nginx -g "daemon off;"
