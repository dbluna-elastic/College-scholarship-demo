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

# Use envsubst to replace variables in nginx.conf
envsubst '${ELASTIC_ES_URL} ${ELASTIC_KB_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
