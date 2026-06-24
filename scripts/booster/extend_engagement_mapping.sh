#!/usr/bin/env bash
# Extend booster-engagement-events mapping with daily timeline fields.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  export $(grep -E '^OK_KIBANA_API_KEY=|^ELASTIC_API_KEY=|^OK_ELASTIC_ES_URL=' "${ROOT_DIR}/.env" | xargs)
fi

ES_URL="${OK_ELASTIC_ES_URL:-https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com}"
API_KEY="${OK_KIBANA_API_KEY:-${ELASTIC_API_KEY:-}}"

if [[ -z "${API_KEY}" ]]; then
  echo "Missing OK_KIBANA_API_KEY or ELASTIC_API_KEY in .env" >&2
  exit 1
fi

echo "Updating mapping on ${ES_URL}/booster-engagement-events ..."

curl -sS -X PUT "${ES_URL}/booster-engagement-events/_mapping" \
  -H "Authorization: ApiKey ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "event_label": { "type": "keyword" },
      "event_category": { "type": "keyword" },
      "baseline_value": { "type": "float" },
      "delta_from_baseline": { "type": "float" }
    }
  }' | python3 -m json.tool

echo "Mapping update complete."
