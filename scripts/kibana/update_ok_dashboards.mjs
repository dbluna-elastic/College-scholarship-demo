#!/usr/bin/env node
/**
 * Apply cohesion/clarity fixes to OK-tagged Kibana dashboards on gawdzilla.
 * Usage: node scripts/kibana/update_ok_dashboards.mjs
 */
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const ROOT = new URL('../..', import.meta.url).pathname;
const envText = readFileSync(`${ROOT}/.env`, 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const API_KEY = env.OK_KIBANA_API_KEY || env.ELASTIC_API_KEY;
const KIBANA_URL = 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com';

if (!API_KEY) {
  console.error('Missing OK_KIBANA_API_KEY or ELASTIC_API_KEY in .env');
  process.exit(1);
}

const TAG_OK = 'c6fa1f4f-8ad7-41c9-9f9c-4411b4aa8976';
const TAG_OK_FRAUD = '6e3ccec0-75b5-4ff0-9c1b-b68bb81f1ced';
const TAG_OK_CLIENT = 'f0873286-a0e3-49ed-8326-2086c378e73b';
const TAG_OK_GRANTS = 'ok-grants-tag';
const TAG_OK_CRISIS = 'ok-crisis-tag';

async function kibana(method, path, body) {
  const res = await fetch(`${KIBANA_URL}${path}`, {
    method,
    headers: {
      Authorization: `ApiKey ${API_KEY}`,
      'kbn-xsrf': 'true',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
}

async function getDashboard(id) {
  return kibana('GET', `/api/saved_objects/dashboard/${id}`);
}

async function putDashboard(id, attributes, references) {
  return kibana('PUT', `/api/saved_objects/dashboard/${id}?overwrite=true`, {
    attributes,
    references,
  });
}

function setGrid(panel, { x, y, w, h }) {
  panel.gridData = { ...panel.gridData, x, y, w, h, i: panel.gridData?.i || panel.panelIndex };
}

function setTitle(panel, title) {
  panel.embeddableConfig = panel.embeddableConfig || {};
  panel.embeddableConfig.title = title;
  const attrs = panel.embeddableConfig.attributes;
  if (attrs) {
    attrs.title = title;
    if (attrs.state?.visualization) {
      attrs.state.visualization.title = title;
    }
  }
}

function clonePanel(panel) {
  const copy = JSON.parse(JSON.stringify(panel));
  const id = randomUUID();
  copy.panelIndex = id;
  setGrid(copy, copy.gridData);
  copy.gridData.i = id;
  return copy;
}

function tagRef(tagId) {
  return { name: `tag-ref-${tagId}`, type: 'tag', id: tagId };
}

function mergeTagRefs(refs, tagIds) {
  const existing = new Set((refs || []).filter((r) => r.type === 'tag').map((r) => r.id));
  const out = [...(refs || [])];
  for (const id of tagIds) {
    if (!existing.has(id)) out.push(tagRef(id));
  }
  return out;
}

async function ensureTags() {
  const tags = [
    {
      id: TAG_OK_GRANTS,
      attributes: {
        name: 'ok-grants',
        description: 'Oklahoma grant program dashboards',
        color: '#006837',
      },
    },
    {
      id: TAG_OK_CRISIS,
      attributes: {
        name: 'ok-crisis',
        description: 'Oklahoma crisis services dashboards',
        color: '#85291b',
      },
    },
  ];
  for (const tag of tags) {
    try {
      await kibana('POST', `/api/saved_objects/tag/${tag.id}`, { attributes: tag.attributes });
      console.log(`Created tag ${tag.attributes.name}`);
    } catch (err) {
      if (String(err.message).includes('409')) {
        console.log(`Tag ${tag.attributes.name} already exists`);
      } else {
        throw err;
      }
    }
  }
}

function fixGrantDashboard(obj) {
  const attrs = { ...obj.attributes };
  const panels = JSON.parse(attrs.panelsJSON).filter((p) => p.type !== 'markdown');

  const kpiTitles = [
    'Total Transactions',
    'Avg Grant Search Duration (ms)',
    'Failed Transactions',
    'Unique Users',
  ];
  let kpiIdx = 0;
  for (const p of panels) {
    if (p.gridData.y >= 4) p.gridData.y -= 4;
    if (p.type === 'vis' && p.gridData.y === 0 && p.gridData.h === 5 && kpiIdx < kpiTitles.length) {
      setTitle(p, kpiTitles[kpiIdx++]);
    }
    if (p.embeddableConfig?.attributes?.title?.includes('Last 24 Hours')) {
      setTitle(p, 'Transaction Count Over Time by Transaction Name — Oklahoma Agency');
    }
  }

  attrs.title = 'Oklahoma — Grants — Search Performance';
  attrs.description =
    'Monitors the POST /api/elastic/ok-fraud/es/ok-grant-data/_search transaction and overall service health for the Oklahoma Agency production service. Use the time picker to adjust the analysis window.';
  attrs.panelsJSON = JSON.stringify(panels);
  attrs.timeRestore = true;
  attrs.timeFrom = attrs.timeFrom || 'now-7d/d';
  attrs.timeTo = attrs.timeTo || 'now';

  const references = mergeTagRefs(obj.references, [TAG_OK, TAG_OK_GRANTS]);
  return { attrs, references };
}

function fixClientDashboard(obj) {
  const attrs = { ...obj.attributes };
  const panels = JSON.parse(attrs.panelsJSON);

  const byIndex = Object.fromEntries(panels.map((p, i) => [i, p]));
  const discover = byIndex[0];
  const relapseMap = byIndex[3];
  const substance = byIndex[2];

  // Drop duplicate untitled map panel [1]
  const next = [discover, relapseMap, substance].filter(Boolean);
  setGrid(discover, { x: 0, y: 0, w: 48, h: 12 });
  setGrid(relapseMap, { x: 0, y: 12, w: 24, h: 14 });
  setGrid(substance, { x: 24, y: 12, w: 24, h: 14 });
  setTitle(relapseMap, 'Relapse Rate by County');
  setTitle(substance, 'Breakdown by Primary Substance');

  attrs.title = 'Oklahoma — Substance Abuse — Client Outcomes';
  attrs.description =
    'Client-level substance abuse outcomes: county relapse patterns and primary substance breakdown. Use Discover for record-level review.';
  attrs.panelsJSON = JSON.stringify(next);

  const references = (obj.references || []).filter(
    (r) => r.name !== '3fca3c5a-f2d8-42fe-a453-70173f9d222b:savedObjectRef',
  );
  return { attrs, references: mergeTagRefs(references, [TAG_OK, TAG_OK_CLIENT]) };
}

function fixFraudDashboard(obj, execPanels, fraudPanels) {
  const attrs = { ...obj.attributes };
  const kpis = execPanels[0]; // total_loss & total_records from exec dashboard
  const lossByFlag = clonePanel(fraudPanels[5]);
  const highRiskTable = clonePanel(fraudPanels[3]);

  setTitle(kpis, 'Medicaid Fraud — Key Metrics');
  setTitle(lossByFlag, 'Loss by Flag Type');
  setTitle(highRiskTable, 'High-Risk Claims — Detail Table');

  setGrid(kpis, { x: 0, y: 0, w: 24, h: 6 });
  setGrid(lossByFlag, { x: 24, y: 0, w: 24, h: 6 });
  setGrid(highRiskTable, { x: 0, y: 6, w: 48, h: 16 });

  attrs.title = 'Oklahoma — Medicaid Fraud — Executive Summary';
  attrs.description =
    'Executive view of Medicaid fraud exposure: total loss, claim volume, loss by flag type, and high-risk claims requiring investigation.';
  attrs.panelsJSON = JSON.stringify([kpis, lossByFlag, highRiskTable]);
  attrs.timeRestore = true;
  attrs.timeFrom = 'now-1y';
  attrs.timeTo = 'now';

  const references = (obj.references || []).filter((r) => r.type === 'tag');
  return { attrs, references: mergeTagRefs(references, [TAG_OK, TAG_OK_FRAUD]) };
}

function fixFraudOverview(obj) {
  const attrs = { ...obj.attributes };
  const panels = JSON.parse(attrs.panelsJSON);
  const panelTitle = (p) =>
    p.embeddableConfig?.attributes?.title ||
    p.embeddableConfig?.title ||
    p.title ||
    '';
  const panelQuery = (p) => {
    const state = p.embeddableConfig?.attributes?.state;
    if (!state?.datasourceStates?.textBased?.layers) return '';
    return Object.values(state.datasourceStates.textBased.layers)[0]?.query?.esql || '';
  };
  const byQuery = (needle) => panels.find((p) => panelQuery(p).includes(needle));

  const pTotal =
    panels.find((p) => {
      const q = panelQuery(p).replace(/\s+/g, ' ').trim();
      return q === 'FROM ok-fraud-phantom-billing | STATS total_loss = SUM(Total_Loss_Value)';
    }) || panels[4];
  const pHighTable = byQuery('Risk_Score >= 75') || panels[3];
  const pLossFlag = byQuery('BY Flag_Type') || panels[5];
  const pLossStatus = byQuery('Patient_Verification_Status') || panels[7];
  const pPhantom = byQuery('Units_Billed == 4') || byQuery('phantom_billing');
  const pMedicaid = byQuery('BY Medicaid_Recipient_ID') || panels[9];
  const pDoctor = byQuery('Provider_Overlap_Count >= 4') || panels[10];
  const pDemo = byQuery('Linked_Demographics_Match_Flag') || panels[1];
  const pTravel = byQuery('Patient_Travel_Radius >= 100') || panels[0];

  const required = [
    ['Total Loss', pTotal],
    ['High-Risk Table', pHighTable],
    ['Loss by Flag Type', pLossFlag],
    ['Loss by Status', pLossStatus],
    ['Phantom Billing', pPhantom],
    ['Medicaid Recyclers', pMedicaid],
    ['Doctor Shopping Overlap', pDoctor],
    ['Demographics Mismatch', pDemo],
    ['Long Travel Radius', pTravel],
  ];
  for (const [name, panel] of required) {
    if (!panel) throw new Error(`Missing fraud overview panel: ${name}`);
  }

  setTitle(pTotal, 'Total Loss YTD');
  setTitle(pHighTable, 'High-Risk Claims — Detail Table');
  setTitle(pLossFlag, 'Loss by Flag Type');
  setTitle(pLossStatus, 'Loss by Verification Status');
  setTitle(pPhantom, 'Phantom Billing — Possible Upcoding');
  setTitle(pMedicaid, 'Medicaid ID — Top Recyclers');
  setTitle(pDoctor, 'Doctor Shopping — High Provider Overlap');
  setTitle(pDemo, 'Medicaid ID — Demographics Mismatch');
  setTitle(pTravel, 'Doctor Shopping — Long Travel Radius');

  // High-risk claims KPI cloned from total loss metric
  const highRiskKpi = clonePanel(pTotal);
  const esql =
    'FROM ok-fraud*\n| WHERE Risk_Score >= 75\n| STATS `High-Risk Claims` = COUNT(*)';
  const layerKey = Object.keys(highRiskKpi.embeddableConfig.attributes.state.datasourceStates.textBased.layers)[0];
  const layer = highRiskKpi.embeddableConfig.attributes.state.datasourceStates.textBased.layers[layerKey];
  layer.query.esql = esql;
  highRiskKpi.embeddableConfig.attributes.state.query.esql = esql;
  highRiskKpi.embeddableConfig.attributes.state.visualization.metricAccessor = 'High-Risk Claims';
  layer.columns = [
    {
      columnId: 'High-Risk Claims',
      fieldName: 'High-Risk Claims',
      label: 'High-Risk Claims',
      customLabel: true,
      meta: { type: 'number', esType: 'long', params: { id: 'number' } },
      inMetricDimension: true,
    },
  ];
  setTitle(highRiskKpi, 'High-Risk Claims');

  setGrid(pTotal, { x: 0, y: 0, w: 12, h: 5 });
  setGrid(highRiskKpi, { x: 12, y: 0, w: 12, h: 5 });
  setGrid(pLossFlag, { x: 0, y: 5, w: 24, h: 12 });
  setGrid(pLossStatus, { x: 24, y: 5, w: 24, h: 12 });
  setGrid(pPhantom, { x: 0, y: 17, w: 16, h: 12 });
  setGrid(pMedicaid, { x: 16, y: 17, w: 16, h: 12 });
  setGrid(pDoctor, { x: 32, y: 17, w: 16, h: 12 });
  setGrid(pHighTable, { x: 0, y: 29, w: 48, h: 14 });
  setGrid(pDemo, { x: 0, y: 43, w: 24, h: 12 });
  setGrid(pTravel, { x: 24, y: 43, w: 24, h: 12 });

  attrs.title = 'Oklahoma — Medicaid Fraud — Overview';
  attrs.description =
    'Operational Medicaid fraud analytics across phantom billing, Medicaid ID theft, and doctor shopping. High-risk claims (Risk Score ≥ 75) are highlighted for investigator follow-up.';
  attrs.panelsJSON = JSON.stringify([
    pTotal,
    highRiskKpi,
    pLossFlag,
    pLossStatus,
    pPhantom,
    pMedicaid,
    pDoctor,
    pHighTable,
    pDemo,
    pTravel,
  ]);
  attrs.timeRestore = true;
  attrs.timeFrom = 'now-1y';
  attrs.timeTo = 'now';

  return { attrs, references: mergeTagRefs(obj.references, [TAG_OK, TAG_OK_FRAUD]) };
}

function fixCrisisDashboard(obj) {
  const attrs = { ...obj.attributes };
  const panels = JSON.parse(attrs.panelsJSON);
  const panelTitle = (p) =>
    p.embeddableConfig?.attributes?.title ||
    p.embeddableConfig?.title ||
    p.title ||
    '';
  const find = (t) => panels.find((p) => panelTitle(p).toLowerCase().includes(t.toLowerCase()));
  const delta = find('Delta Call') || find('Call Answer') || panels[1];
  const calls = find('Calls received') || panels[2];
  const callOutcome = panels.find((p) => /^Outcome of Call/i.test(panelTitle(p).trim())) || panels[0];
  const dispatchOutcome = find('Outcome of Dispatch') || panels[4];
  const mcot = find('Mobile Crisis') || find('MCOT') || panels[5];
  const housing = find('Discahrged') || find('Discharged') || find('Housing Status') || panels[7];
  const mobileTeam = find('Mobile team') || panels[3];
  const crisisResults = find('Crisis Call Results') || panels[6];

  const required = [
    ['Delta Call', delta],
    ['Calls received', calls],
    ['Outcome of Call', callOutcome],
    ['Outcome of Dispatch', dispatchOutcome],
    ['MCOT', mcot],
    ['Housing', housing],
    ['Mobile team', mobileTeam],
    ['Crisis Call Results', crisisResults],
  ];
  for (const [name, panel] of required) {
    if (!panel) throw new Error(`Missing crisis panel: ${name}`);
  }

  setTitle(delta, 'Avg Call Answer Time (Seconds)');
  setTitle(calls, 'Calls Received by Call Center');
  setTitle(callOutcome, 'Outcome of Call');
  setTitle(dispatchOutcome, 'Outcome of Dispatch');
  setTitle(mcot, 'Mobile Crisis Outreach Team Response Time');
  setTitle(housing, 'Discharged Housing Status');
  setTitle(mobileTeam, 'Mobile Team — Call Start to Deployed');
  setTitle(crisisResults, 'Crisis Call Results');

  setGrid(delta, { x: 0, y: 0, w: 24, h: 10 });
  setGrid(calls, { x: 24, y: 0, w: 24, h: 10 });
  setGrid(callOutcome, { x: 0, y: 10, w: 24, h: 11 });
  setGrid(dispatchOutcome, { x: 24, y: 10, w: 24, h: 11 });
  setGrid(mcot, { x: 0, y: 21, w: 24, h: 12 });
  setGrid(housing, { x: 24, y: 21, w: 24, h: 12 });
  setGrid(mobileTeam, { x: 0, y: 33, w: 24, h: 12 });
  setGrid(crisisResults, { x: 24, y: 33, w: 24, h: 12 });

  attrs.title = 'Oklahoma — Crisis Services — Call Center & Dispatch';
  attrs.description =
    'ODMHSAS crisis call center and mobile crisis outreach metrics: answer times, call volume, dispatch outcomes, MCOT response time, and housing status at discharge.';
  attrs.panelsJSON = JSON.stringify([
    delta,
    calls,
    callOutcome,
    dispatchOutcome,
    mcot,
    housing,
    mobileTeam,
    crisisResults,
  ]);
  attrs.timeRestore = true;
  attrs.timeFrom = 'now-90d';
  attrs.timeTo = 'now';

  return { attrs, references: mergeTagRefs(obj.references, [TAG_OK, TAG_OK_CLIENT, TAG_OK_CRISIS]) };
}

async function main() {
  console.log('Ensuring tags...');
  await ensureTags();

  const ids = {
    grant: '48e661bc-9939-4daa-946c-de2bfe33ef65',
    client: '3880ff5a-af96-4811-8071-09d5aff0054a',
    fraudExec: '46726649-5d76-4d66-b1ca-326ccef7681e',
    fraud: '90688957-e33d-42dd-bc96-c3e348be3b85',
    crisis: '030e8156-3e34-4cee-b485-0d64115ec8b8',
  };

  const fraudObj = await getDashboard(ids.fraud);
  const fraudExecObj = await getDashboard(ids.fraudExec);
  const fraudPanels = JSON.parse(fraudObj.attributes.panelsJSON);
  const fraudExecPanels = JSON.parse(fraudExecObj.attributes.panelsJSON);

  const updates = [
    ['Grant Performance', ids.grant, fixGrantDashboard(await getDashboard(ids.grant))],
    ['Client Outcomes', ids.client, fixClientDashboard(await getDashboard(ids.client))],
    ['Fraud Overview', ids.fraud, fixFraudOverview(fraudObj)],
    ['Fraud Executive', ids.fraudExec, fixFraudDashboard(fraudExecObj, fraudExecPanels, fraudPanels)],
    ['Crisis Services', ids.crisis, fixCrisisDashboard(await getDashboard(ids.crisis))],
  ];

  for (const [label, id, { attrs, references }] of updates) {
    console.log(`Updating ${label} (${id})...`);
    await putDashboard(id, attrs, references);
    console.log(`  ✓ ${attrs.title}`);
  }

  console.log('\nAll OK dashboard updates applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
