#!/usr/bin/env bash
# Bulk index daily engagement events into booster-engagement-events.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NDJSON="${SCRIPT_DIR}/engagement_events_daily.ndjson"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  export $(grep -E '^OK_KIBANA_API_KEY=|^ELASTIC_API_KEY=|^OK_ELASTIC_ES_URL=' "${ROOT_DIR}/.env" | xargs)
fi

ES_URL="${OK_ELASTIC_ES_URL:-https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com}"
API_KEY="${OK_KIBANA_API_KEY:-${ELASTIC_API_KEY:-}}"

if [[ -z "${API_KEY}" ]]; then
  echo "Missing OK_KIBANA_API_KEY or ELASTIC_API_KEY in .env" >&2
  exit 1
fi

if [[ ! -f "${NDJSON}" ]]; then
  echo "NDJSON not found. Run: python3 scripts/booster/generate_engagement_events_daily.py" >&2
  exit 1
fi

echo "Bulk indexing $(wc -l < "${NDJSON}" | tr -d ' ') lines from ${NDJSON} ..."

curl -sS -X POST "${ES_URL}/booster-engagement-events/_bulk" \
  -H "Authorization: ApiKey ${API_KEY}" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @"${NDJSON}" | python3 -c "
import json, sys
resp = json.load(sys.stdin)
errors = resp.get('errors', False)
items = resp.get('items', [])
failed = [i for i in items if i.get('index', {}).get('error')]
print(f\"Indexed batch: errors={errors}, failed={len(failed)}\")
if failed[:3]:
    print(json.dumps(failed[:3], indent=2))
    sys.exit(1)
"

echo "Bulk index complete."
