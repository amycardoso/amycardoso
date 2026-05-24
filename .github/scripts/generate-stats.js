#!/usr/bin/env node
'use strict';

const fs = require('fs');

const TOKEN = process.env.GH_TOKEN;
const USERNAME = 'amycardoso';

async function fetchGraphQL(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'readme-stats-generator',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
    repositories(first: 30, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node { name }
          }
        }
      }
    }
  }
}`;

function computeStreaks(calendar) {
  const allDays = calendar.weeks
    .flatMap(w => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  let longestStreak = 0, tempStreak = 0;
  for (const day of allDays) {
    if (day.contributionCount > 0) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); }
    else tempStreak = 0;
  }

  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  for (const day of [...allDays].reverse()) {
    if (day.date > today) continue;
    if (day.contributionCount > 0) currentStreak++;
    else if (day.date === today) continue;
    else break;
  }

  return { currentStreak, longestStreak };
}

function getTopLanguages(repos) {
  const bytes = {};
  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      bytes[name] = (bytes[name] || 0) + edge.size;
    }
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(bytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, b]) => ({ name: name.toLowerCase(), pct: Math.round((b / total) * 100) }));
}

function generateSVG({ total, currentStreak, longestStreak, languages }, theme) {
  const dark = theme === 'dark';
  const bg       = dark ? '#0d1117' : '#ffffff';
  const border   = dark ? '#21262d' : '#e1e4e8';
  const labelClr = dark ? '#8b949e' : '#586069';
  const valueClr = dark ? '#e6edf3' : '#24292e';
  const barBg    = dark ? '#21262d' : '#eaecef';
  const barClrs  = dark
    ? ['#f72585', '#bb9af7', '#4cc9f0']
    : ['#c2185b', '#7c3aed', '#0891b2'];

  const W = 480, PAD = 24, ROW_H = 30;
  const LABEL_W = 152, BAR_X = PAD + LABEL_W, BAR_W = 200, VAL_X = BAR_X + BAR_W + 14;

  const contribRows = [
    { label: 'contributions', value: total,         max: Math.max(total, 1),          unit: '',     color: barClrs[0] },
    { label: 'longest streak', value: longestStreak, max: Math.max(longestStreak, 1),  unit: ' days', color: barClrs[1] },
    { label: 'current streak', value: currentStreak, max: Math.max(longestStreak, 1),  unit: ' days', color: barClrs[2] },
  ];
  const langRows = languages.map((l, i) => ({
    label: l.name, value: l.pct, max: 100, unit: '%', color: barClrs[i % 3],
  }));

  const allSections = [contribRows, langRows].filter(s => s.length > 0);
  const totalRows = allSections.reduce((a, s) => a + s.length, 0);
  const dividers = allSections.length - 1;
  const H = PAD + (totalRows * ROW_H) + (dividers * 16) + PAD;

  let body = '';
  let y = PAD + ROW_H * 0.7;

  for (let si = 0; si < allSections.length; si++) {
    if (si > 0) {
      body += `<line x1="${PAD}" y1="${y - ROW_H * 0.3 + 4}" x2="${W - PAD}" y2="${y - ROW_H * 0.3 + 4}" stroke="${border}" stroke-width="1"/>`;
      y += 16;
    }
    for (const row of allSections[si]) {
      const fill = Math.max(2, Math.round((row.value / row.max) * BAR_W));
      const label = row.label.length > 15 ? row.label.slice(0, 14) + '…' : row.label;
      const valText = row.unit === '%' ? `${row.value}%` : String(row.value);

      body += `<text x="${PAD}" y="${y}" font-family="'Fira Code',Consolas,'Courier New',monospace" font-size="12" fill="${labelClr}">${label}</text>`;
      body += `<rect x="${BAR_X}" y="${y - 12}" width="${BAR_W}" height="14" rx="3" fill="${barBg}"/>`;
      body += `<rect x="${BAR_X}" y="${y - 12}" width="${fill}" height="14" rx="3" fill="${row.color}"/>`;
      body += `<text x="${VAL_X}" y="${y}" font-family="'Fira Code',Consolas,'Courier New',monospace" font-size="12" fill="${valueClr}">${valText}</text>`;
      y += ROW_H;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>
  ${body}
</svg>`;
}

async function main() {
  const data = await fetchGraphQL(QUERY, { username: USERNAME });
  const calendar = data.user.contributionsCollection.contributionCalendar;
  const repos = data.user.repositories.nodes;

  const total = calendar.totalContributions;
  const { currentStreak, longestStreak } = computeStreaks(calendar);
  const languages = getTopLanguages(repos);

  const statsData = { total, currentStreak, longestStreak, languages };

  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/stats.svg',       generateSVG(statsData, 'dark'));
  fs.writeFileSync('assets/stats-light.svg', generateSVG(statsData, 'light'));

  console.log(`✓ stats: ${total} contributions | streak ${currentStreak} | longest ${longestStreak} | langs: ${languages.map(l => l.name).join(', ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
