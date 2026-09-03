# Template Engine Testing Guide

## Phase 2: Template Engine Implementation

The template engine allows the application to switch between different branding and content configurations based on multiple detection strategies.

## Template Detection Strategies

The template engine tries these methods in order:

1. **URL Parameter**: `?template=texas`
2. **Subdomain**: `texas.example.com`
3. **Environment Variable**: `TEMPLATE_ID=texas`
4. **Default Fallback**: Uses `default` template

## Available Templates

- `default` - Generic fallback template
- `texas` - Texas-specific branding (Blue & Orange)
- `oklahoma` - Oklahoma-specific branding (Crimson & Cream)
- `beauregard` - Beauregard Springs High School (Jackalopes theme)
- `okagency` - State agency template (Oklahoma Agency style)
- `okmentalhealth` - Oklahoma Department of Mental Health (same overlay layout, mental health content)
- `dot` - Department of Transportation (State Agency, Gov aesthetic)
- `texascollege` - Texas College athletic booster & game day revenue portal
- `okstate` - Oklahoma State athletic booster & game day revenue portal
- `okoja` - Oklahoma Office of Juvenile Affairs staff portal
- `oumet` - OU School of Meteorology THREDDS catalog & data provisioning
- `snapfraud` - SNAP/EBT fraud detection investigator portal (gawdzilla snap-* indices)
- `wyoming` - Wyoming ETS data classification portal (wyo-classified-*, wyo-public-share)

## Agent Builder agents by template

| Template | Agent ID(s) | Setup script |
|----------|-------------|--------------|
| `default` | `scholarship-counselor-default` | `scripts/scholarship/setup_agents.py` |
| `texas` | `texas-scholarship-counselor` | `scripts/scholarship/setup_agents.py` |
| `oklahoma` | `oklahoma-scholarship-counselor` | `scripts/scholarship/setup_agents.py` |
| `beauregard` | `beauregard-scholarship-counselor` | `scripts/scholarship/setup_agents.py` |
| `dot` | `dot-transportation-assistant` | `scripts/scholarship/setup_agents.py` |
| `okagency` | `ok-grants-data` | `scripts/grants/setup_agent.py` |
| `okmentalhealth` | `ok-grants-data` (public chat), `ok-fraud` (staff) | grants + fraud scripts |
| `texascollege` | `booster-donor-data`, `gameday-revenue-data` | booster + gameday scripts |
| `okstate` | `okstate-donor-assistant`, `okstate-gameday-revenue-assistant` | `scripts/okstate/setup_workflow.py` (chat agents already on Gawdzilla) |
| `okoja` | `ok-oja-data` | `scripts/oja/setup_agent.py` |
| `oumet` | `ou-met-catalog-agent`, `ou-met-provisioning-agent` | `scripts/weather/run_demo.py` |
| `snapfraud` | `snap-fraud-investigator` | `snap-demo/scripts/setup_agent_builder.py` (see `scripts/snap/README.md`) |
| `wyoming` | `wyo-classify` | `scripts/wyoming/setup_agent.py` |

Provision all agents: `bash scripts/setup_all_agents.sh` (requires `OK_KIBANA_API_KEY` / `ELASTIC_API_KEY` in `.env`).

## Testing Template Switching

### Method 1: URL Parameter (Easiest for Testing)

1. **Default Template:**
   ```
   http://localhost:8089
   ```

2. **Texas Template:**
   ```
   http://localhost:8089?template=texas
   ```

3. **Oklahoma Template:**
   ```
   http://localhost:8089?template=oklahoma
   ```

4. **State Agency (okagency) Template:**
   ```
   http://localhost:8089?template=okagency
   ```

5. **Oklahoma Department of Mental Health (okmentalhealth) Template:**
   ```
   http://localhost:8089?template=okmentalhealth
   ```

6. **Department of Transportation (dot) Template:**
   ```
   http://localhost:8089?template=dot
   ```

7. **Texas College (texascollege) Template:**
   ```
   http://localhost:8089?template=texascollege
   ```

   Staff login: password `staff` → Athletic Advancement Dashboard (Donor Engagement + Game Day Revenue).

8. **Oklahoma State (okstate) Template:**
   ```
   http://localhost:8089?template=okstate
   ```

   Staff login: password `staff` → Athletic Advancement Dashboard (Donor Engagement + Game Day Revenue).

   Chat agents: `okstate-donor-assistant` (donors tab), `okstate-gameday-revenue-assistant` (game day tab).

   Game Day uses Boone Pickens **tickets + Square POS** (`okstate-paciolan-ticket-events`, `okstate-square-pos-transactions`), not the Texas College bookstore catalog.

   Demo chat prompts (game day tab):
   - *"How much combined gameday revenue did we make?"*
   - *"Which stands are performing best?"*
   - *"What happened at Club Orange during the payment outage?"* → S04 / S06 / S09 near-zero txns 15:50–16:05 UTC

   Alumni email workflow: `oklahoma-state-alumni-outreach-email` (deploy with `python3 scripts/okstate/setup_workflow.py`).

   Foundation giving rules (index + Agent Builder): `python3 scripts/okstate/ingest_giving_policies.py` then `python3 scripts/okstate/setup_giving_agent.py`. Suggested chips like *"How do I donate to OSU through the Foundation?"* skip the fast path so the agent searches `okstate-giving-policies`. Portfolio / at-risk chips still use booster data.

9. **OJA Juvenile Justice (okoja) Template:**
   ```
   http://localhost:8089?template=okoja
   ```

10. **OU Meteorology (oumet) Template:**
   ```
   http://localhost:8089?template=oumet
   ```

   Staff login: password `staff` → Data Provisioning Operations portal.

   Demo chat prompts (catalog agent):
   - *"I need GFS reanalysis for September 2017"* → auto_mount + ETA
   - *"What HRRR files are available?"* → direct OPeNDAP
   - *"I need CCS034 research data"* → approval_required

   **Catalog Access drawer:** scroll to **Data Catalog**, click any row (try the featured **Irma NEXRAD** row) to open OPeNDAP / HTTPServer / CdmRemote links with copy and preview actions.

11. **SNAP Fraud Detection (snapfraud) Template:**
   ```
   http://localhost:8089?template=snapfraud
   ```

   Staff login: password `staff` → SNAP Fraud Investigator Portal.

   Demo chat prompts:
   - *"Which stores show same-cent trafficking?"* → store 4471
   - *"Show cross-state identity fraud"* → seeded SSN hash
   - *"Which deceased beneficiaries are still transacting?"* → hh_deceased_demo_001

12. **Wyoming Data Classification (wyoming) Template:**
   ```
   http://localhost:8089?template=wyoming
   ```

   Staff login: password `staff` → Data Classification Operations.

   Chat agent: `wyo-classify`. Demo prompts:
   - *"How many documents are classified, and how many are restricted or pending review?"*
   - *"What is in the pending review queue?"*
   - *"Are any restricted documents in the public share?"*

   Public landing shows classification-level tiles and live KPIs from `wyo-classified-*` / `wyo-public-share`. Staff view adds pending review (lowest confidence first), agency counts, and public-share spillage.

   Load the synthetic corpus from **data-classification-tool** onto the same Elasticsearch cluster this demo proxies. Provision chat with `python3 scripts/wyoming/setup_agent.py`. See [scripts/wyoming/README.md](./scripts/wyoming/README.md).

### Method 2: Environment Variable

Add to your `.env` file:
```bash
TEMPLATE_ID=texas
```

Then rebuild and restart:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Method 3: Subdomain (Production)

In production, configure DNS to point:
- `texas.yourdomain.com` → Your server
- `oklahoma.yourdomain.com` → Your server

The template engine will automatically detect the subdomain.

## What Changes with Each Template

Each template provides:

1. **Branding:**
   - Institution name
   - Tagline
   - Logo path

2. **Content:**
   - Hero title
   - Hero subtitle
   - CTA button text
   - State-specific messaging

3. **Colors:**
   - Primary color (applied as CSS variable)
   - Secondary color
   - Warning color
   - Background colors

4. **Elastic Configuration:**
   - Agent ID (can be overridden via environment)

## Browser Console

Open your browser's developer console to see:
- Template initialization messages
- Template switching events
- Environment variable checks

Example console output:
```
🚀 Application initialized
🎨 Template Engine initialized: Texas (texas)
✅ Template applied to page: Texas
```

## Programmatic Template Switching

You can also switch templates programmatically in the browser console:

```javascript
import { switchTemplate } from './js/config/templateEngine.js';
switchTemplate('texas');
```

This will trigger a `templateChanged` event that updates the page automatically.
