#!/usr/bin/env node
'use strict';

const fs = require('fs');

const USER         = 'amycardoso';
const MANIFEST_URL = 'https://raw.githubusercontent.com/amycardoso/creative-coding/main/manifest.json';
const TOKEN        = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN;
// Orgs whose repos count too, each with its own fine-grained token (one token reaches one owner);
// any other org I belong to stays out
const ORG_TOKENS   = { reformasimples: process.env.GH_STATS_ORG_TOKEN };
const TZ           = 'America/Sao_Paulo';
const OUT_DIR      = 'assets/stats';
const LANG_COUNT   = 3;
// Markup/config languages that say little about what was actually built
const IGNORED_LANGS = new Set(['HTML', 'CSS', 'SCSS', 'Dockerfile', 'Makefile', 'Procfile', 'Batchfile']);
const LANG_ALIASES  = { 'Jupyter Notebook': 'Python' };

const THEMES = {
  dark:  { text: '#e6edf3', muted: '#8b949e', track: '#30363d', accents: ['#f72585', '#7209b7', '#4cc9f0'] },
  light: { text: '#1f2328', muted: '#57606a', track: '#d0d7de', accents: ['#c2185b', '#5b21b6', '#0891b2'] },
};

async function gh(path, { allowMissing = false, token = TOKEN } = {}) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  // 403/404/409: repo not visible to this token, or empty repo
  if (allowMissing && [403, 404, 409].includes(res.status)) return null;
  if (!res.ok) throw new Error(`GitHub API ${path}: ${res.status}`);
  return res.json();
}

async function ghPages(path, opts) {
  const items = [];
  for (let page = 1; ; page++) {
    const data = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, opts);
    if (!data) break;
    items.push(...data);
    if (data.length < 100) break;
  }
  return items;
}

// Commits from the last 12 months, as { date, repo, token }
async function fetchCommits() {
  const since = new Date(Date.now() - 365 * 864e5);
  return process.env.GH_STATS_TOKEN ? commitsByRepo(since) : commitsBySearch(since);
}

// With a personal token: walk my repos one by one, so private ones count too
// (commit search leaves private repos out for fine-grained tokens)
async function commitsByRepo(since) {
  const sources = [{
    repos: (await ghPages('user/repos?affiliation=owner,collaborator,organization_member'))
      .filter(r => r.owner.type !== 'Organization'),
    token: TOKEN,
  }];
  for (const [org, token] of Object.entries(ORG_TOKENS)) {
    if (token) sources.push({ repos: await ghPages(`orgs/${org}/repos?type=all`, { token }), token });
  }

  const commits = [];
  for (const { repos, token } of sources) {
    for (const repo of repos.filter(r => !r.fork && new Date(r.pushed_at) >= since)) {
      const list = await ghPages(`repos/${repo.full_name}/commits?author=${USER}&since=${since.toISOString()}`, { allowMissing: true, token });
      for (const c of list) commits.push({ date: c.commit.author.date, repo: repo.full_name, token });
    }
  }
  return commits;
}

// Without one: public commits via search (capped at 1000 results)
async function commitsBySearch(since) {
  const commits = [];
  for (let page = 1; page <= 10; page++) {
    const data = await gh(`search/commits?q=author:${USER}+author-date:>=${since.toISOString().slice(0, 10)}&sort=author-date&per_page=100&page=${page}`);
    for (const c of data.items) commits.push({ date: c.commit.author.date, repo: c.repository.full_name });
    if (data.items.length < 100) break;
    await new Promise(r => setTimeout(r, 2500)); // stay under the search API's secondary rate limit
  }
  return commits;
}

function hourHistogram(commits) {
  const hours = new Array(24).fill(0);
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ });
  for (const c of commits) hours[Number(fmt.format(new Date(c.date)))]++;
  return hours;
}

// Each repo's language mix, weighted by how many of my commits landed there
async function languageShares(commits) {
  const perRepo = {};
  const tokens = {};
  for (const c of commits) {
    perRepo[c.repo] = (perRepo[c.repo] || 0) + 1;
    tokens[c.repo] = c.token;
  }

  const totals = {};
  for (const [repo, count] of Object.entries(perRepo)) {
    const langs = await gh(`repos/${repo}/languages`, { token: tokens[repo] });
    const kept = Object.entries(langs).filter(([name]) => !IGNORED_LANGS.has(name));
    const bytes = kept.reduce((sum, [, b]) => sum + b, 0);
    if (!bytes) continue;
    for (const [name, b] of kept) {
      const key = LANG_ALIASES[name] || name;
      totals[key] = (totals[key] || 0) + count * (b / bytes);
    }
  }

  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const top = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, LANG_COUNT)
    .map(([name, w]) => ({ name: name.toLowerCase(), pct: Math.round((w / sum) * 100) }));
  // Everything past the top languages, so the legend adds up to 100%
  const rest = 100 - top.reduce((a, l) => a + l.pct, 0);
  return rest > 0 ? [...top, { name: 'other', pct: rest }] : top;
}

async function sketchStats() {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.sketches;
  const last = list.map(s => s.date).sort().pop();
  const days = Math.floor((Date.now() - new Date(`${last}T12:00:00Z`)) / 864e5);
  return { total: list.length, lastAgo: days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago` };
}

function peakLabel(hour) {
  if (hour >= 22 || hour < 5) return 'night owl';
  if (hour < 12) return 'early bird';
  if (hour < 18) return 'afternoon person';
  return 'evening coder';
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function renderSvg({ hours, langs, sketches }, t) {
  const font = `font-family="'SF Mono','Fira Code',monospace"`;
  const caption = (x, label) => `<text x="${x}" y="14" ${font} font-size="10" fill="${t.muted}" letter-spacing="1">${label}</text>`;

  // Column 1 — commit hours histogram
  const max = Math.max(...hours, 1);
  const peak = hours.indexOf(max);
  const bars = hours.map((n, h) => {
    const height = Math.max(2, Math.round((n / max) * 30));
    const fill = h === peak ? t.accents[0] : t.muted;
    return `<rect x="${h * 7}" y="${54 - height}" width="5" height="${height}" rx="1" fill="${fill}" opacity="${h === peak ? 1 : 0.55}"/>`;
  }).join('');
  const col1 = `
  ${caption(0, 'COMMIT HOURS')}
  <g>${bars}</g>
  <text x="0" y="72" ${font} font-size="11" fill="${t.text}">peak ${String(peak).padStart(2, '0')}h · ${peakLabel(peak)}</text>`;

  // Column 2 — languages, stacked bar + legend (the 'other' row takes the muted color)
  const color = i => t.accents[i] || t.muted;
  let x = 0;
  const segs = langs.map((l, i) => {
    const w = (l.pct / 100) * 170;
    const r = `<rect x="${x.toFixed(1)}" y="22" width="${Math.max(w - 2, 1).toFixed(1)}" height="6" rx="2" fill="${color(i)}"/>`;
    x += w;
    return r;
  }).join('');
  const legend = langs.map((l, i) =>
    `<text x="0" y="${38 + i * 12}" ${font} font-size="11" fill="${t.text}"><tspan fill="${color(i)}">●</tspan> ${esc(l.name)}</text>` +
    `<text x="170" y="${38 + i * 12}" ${font} font-size="10" fill="${t.muted}" text-anchor="end">${l.pct}%</text>`
  ).join('');
  const col2 = `
  <g transform="translate(205,0)">
    ${caption(0, 'LANGUAGES · 12MO')}
    <rect x="0" y="22" width="170" height="6" rx="2" fill="${t.track}"/>
    ${segs}
    ${legend}
  </g>`;

  // Column 3 — creative coding
  const col3 = `
  <g transform="translate(410,0)">
    ${caption(0, 'SKETCHES')}
    <text x="0" y="54" ${font} font-size="28" fill="${t.accents[0]}">${sketches.total}</text>
    <text x="0" y="72" ${font} font-size="11" fill="${t.text}">last one ${sketches.lastAgo}</text>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="80" viewBox="-10 0 580 80">${col1}${col2}${col3}
</svg>
`;
}

async function main() {
  const commits = await fetchCommits();
  const stats = {
    hours: hourHistogram(commits),
    langs: await languageShares(commits),
    sketches: await sketchStats(),
  };
  console.log(`commits: ${commits.length}`, JSON.stringify(stats));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(`${OUT_DIR}/stats.svg`, renderSvg(stats, THEMES.dark));
  fs.writeFileSync(`${OUT_DIR}/stats-light.svg`, renderSvg(stats, THEMES.light));
  console.log(`✓ Stats written to ${OUT_DIR}/`);
}

main().catch(err => { console.error(err); process.exit(1); });
