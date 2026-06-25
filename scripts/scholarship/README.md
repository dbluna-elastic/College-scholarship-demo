# Scholarship Template Agents

Per-template Agent Builder agents for the scholarship portal templates. Each agent shares core tools from the legacy `studentcounselor` migration plus a template-specific ES|QL lookup tool.

## Prerequisites

- `ELASTIC_API_KEY` (or `OK_KIBANA_API_KEY`) in `.env`
- `ELASTIC_KB_URL` pointing at Gawdzilla Kibana
- Shared tools deployed first:

```bash
python3 scripts/migrate-apex-to-gawdzilla/migrate.py --agents-only
```

## Agents

| Template | Agent ID | State-scoped tool |
|----------|----------|-------------------|
| `default` | `scholarship-counselor-default` | `default-scholarship-overview` |
| `texas` | `texas-scholarship-counselor` | `texas-scholarships-by-state` |
| `oklahoma` | `oklahoma-scholarship-counselor` | `oklahoma-scholarships-by-state` |
| `beauregard` | `beauregard-scholarship-counselor` | `beauregard-scholarships-by-state` |
| `dot` | `dot-transportation-assistant` | `dot-transportation-grants` |

## Shared tools (attached to every agent)

- `scholarship_index` — semantic scholarship search
- `counselor_policies` — institutional aid policies
- `gsustudenthelper` — university web crawl helper
- `platform.core.get_document_by_id`

## Setup

```bash
python3 scripts/scholarship/setup_agents.py
```

## Verify

Open `http://localhost:8089?template=texas`, log in as a student, and ask the chat: **"What scholarships are available in Texas?"**
