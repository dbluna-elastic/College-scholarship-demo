# Carey Grant Bot — Agent Builder tools

The **Carey Grant Bot** (`ok-grants-data`) powers Oklahoma Agency chat (`?template=okagency`). The app uses a **hybrid fast path**: common grant questions are answered directly from the `ok-grant-data` index before calling Agent Builder.

Configure matching tools in Kibana (gawdzilla) so the agent uses narrow, fast lookups instead of open-ended search + ESQL generation.

## Prerequisites

- Agent ID: `ok-grants-data` (must match `js/config/templates/okagency.js`)
- Index: `ok-grant-data` on gawdzilla ES
- API key: `OK_KIBANA_API_KEY` in `.env`
- Do **not** set `ELASTIC_AGENT_ID` unless you intend to override the template agent globally

## Recommended custom tools

Add these tools in **Stack Management → Agent Builder → ok-grants-data → Tools**. Use tool IDs exactly as listed so the UI shows friendly step labels.

| Tool ID | Purpose | When to use |
|---------|---------|-------------|
| `ok-grants-portfolio-stats` | Count active / forecasted / closed grants | “How many grants are open?” |
| `ok-grants-search` | Keyword search on title + description | “Find broadband grants” |
| `ok-grants-by-status` | Filter by Active / Forecasted / Closed | “What workforce grants are open right now?” |
| `ok-grants-by-category` | Filter by category (workforce, infrastructure, …) | “Show education grants” |
| `ok-grants-by-applicant` | Filter by eligible applicant type | “Grants for small business” |
| `ok-grants-deadlines` | Upcoming deadlines, soonest first | “What deadlines are coming up?” |
| `ok-grants-by-id` | Single grant by portal / program ID | “Tell me about grant g4” |

## Example tool: keyword search

**Tool ID:** `ok-grants-search`

**Description:** Search the ok-grant-data index for grant opportunities by keyword in title, description, or category. Return at most 8 results with title, status, deadline, agency, and a one-line description.

**Implementation:** Use Elasticsearch `_search` on index `ok-grant-data` with `multi_match` on `Grant_Title`, `Title`, `Purpose`, `Description`, `Category`, `State_Agency`. Do not generate ESQL for simple keyword questions.

## Example tool: portfolio stats

**Tool ID:** `ok-grants-portfolio-stats`

**Description:** Return counts of total, active, forecasted, and closed grants plus how many require match funding or are loans.

**Implementation:** Run a single `_search` with `size: 0` and terms aggregations on `Status` / `status`, or fetch up to 500 docs and aggregate in the tool response handler.

## Agent instructions (system prompt snippet)

Add to the agent instructions:

```
You help users find Oklahoma state grant opportunities. Prefer these tools in order:
1. ok-grants-portfolio-stats for counts and overview
2. ok-grants-by-status or ok-grants-by-category for filtered lists
3. ok-grants-search for keyword lookups
4. ok-grants-deadlines for deadline questions
5. ok-grants-by-id for a specific program

Do NOT use generate_esql or broad platform search for questions that match the tools above.
Keep answers concise: bullet list with title, status, deadline, agency.
If the user asks about eligibility or how to apply, cite fields from the grant document.
```

## Frontend fast path (instant answers)

These client-side intents bypass Agent Builder entirely (sub-second):

- Portfolio stats, active/forecasted/closed lists
- Category keywords: workforce, broadband, education, health, …
- Applicant type: business, nonprofit, public, tribal
- Upcoming deadlines, loans, no-match grants
- Keyword search and grant ID lookup (`g1`, portal IDs)

See `js/modules/utils/grantsChatFastPath.js` and `js/modules/utils/grantsChatQueries.js`.

## Verify

1. Open `http://localhost:8089?template=okagency`
2. Open Carey Grant Bot chat
3. Try: **“What workforce grants are open right now?”** — should show “Instant data lookup” and respond in ~1s
4. Try a novel question that does not match fast path — should stream via Agent Builder with tool step labels
