#!/usr/bin/env bash
# Provision all Agent Builder agents, tools, and workflows for every template.
# Run from repo root. Requires OK_KIBANA_API_KEY / ELASTIC_API_KEY in .env.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Scholarship agents (default, texas, oklahoma, beauregard, dot)"
python3 scripts/scholarship/setup_agents.py

echo "==> Carey Grant Bot (okagency, okmentalhealth public chat)"
python3 scripts/grants/setup_agent.py
python3 scripts/grants/setup_workflow.py

echo "==> ODMHSAS fraud & outcomes (okmentalhealth staff)"
python3 scripts/fraud/setup_agent.py

echo "==> Texas College booster donors"
python3 scripts/booster/setup_agent.py
python3 scripts/booster/setup_workflow.py

echo "==> Texas College game day revenue"
python3 scripts/gameday/setup_agent.py

echo "==> Oklahoma State alumni email workflow (chat agents already exist)"
python3 scripts/okstate/setup_workflow.py
echo "==> Oklahoma State Foundation giving policies"
python3 scripts/okstate/ingest_giving_policies.py
python3 scripts/okstate/setup_giving_agent.py

echo "==> OJA juvenile justice"
python3 scripts/oja/setup_workflow.py
python3 scripts/oja/setup_agent.py

echo "==> OU Meteorology catalog (oumet template)"
python3 scripts/weather/run_demo.py --skip-crawl

echo "==> SNAP fraud investigator (snapfraud template)"
SNAP_SETUP="../snap-demo/snap-demo/scripts/setup_agent_builder.py"
if [ -f "$SNAP_SETUP" ]; then
  python3 "$SNAP_SETUP"
else
  echo "Skip SNAP agent: run snap-demo/scripts/setup_agent_builder.py (see scripts/snap/README.md)"
fi

echo "All Agent Builder setup scripts completed."
