import fs from 'node:fs/promises';

const COUNTER_ID = process.env.METRIKA_COUNTER_ID || '109886442';
const TOKEN = process.env.METRIKA_OAUTH_TOKEN;

if (!TOKEN) {
  console.error('Missing METRIKA_OAUTH_TOKEN env var.');
  process.exit(1);
}

const url = new URL('https://api-metrika.yandex.net/stat/v1/data');
url.searchParams.set('id', COUNTER_ID);
url.searchParams.set('metrics', 'ym:s:visits');
url.searchParams.set('date1', '30daysAgo');
url.searchParams.set('date2', 'today');

const res = await fetch(url, {
  headers: {
    Authorization: `OAuth ${TOKEN}`,
  },
});

if (!res.ok) {
  const text = await res.text().catch(() => '');
  console.error('Metrika API error:', res.status, text.slice(0, 600));
  process.exit(1);
}

const json = await res.json();
const visits = Number(json?.totals?.[0]);
if (!Number.isFinite(visits)) {
  console.error('Unexpected API response, totals[0] is not a number.');
  process.exit(1);
}

const payload = {
  monthlyVisits: Math.round(visits),
  updated: new Date().toISOString().slice(0, 10),
  source: 'yandex_metrika_api',
};

// 1) stats.json at repo root (works for GitHub Pages root)
await fs.writeFile('stats.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');

// 2) keep a copy for local dev folder (optional)
try {
  await fs.writeFile('solarboss-landing/stats.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');
} catch {
  // ignore if folder doesn't exist in that repo layout
}

console.log('Updated stats.json:', payload);

