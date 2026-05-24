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
      }
    }
  }
}`;

function generateSVG(total, theme) {
  const dark     = theme === 'dark';
  const bg       = dark ? '#0d1117' : '#ffffff';
  const border   = dark ? '#21262d' : '#e1e4e8';
  const labelClr = dark ? '#8b949e' : '#586069';
  const valueClr = dark ? '#e6edf3' : '#24292e';
  const barBg    = dark ? '#21262d' : '#eaecef';
  const barClr   = dark ? '#f72585' : '#c2185b';

  const W = 480, H = 64, PAD = 24;
  const LABEL_W = 152, BAR_X = PAD + LABEL_W, BAR_W = 200, VAL_X = BAR_X + BAR_W + 14;
  const y = H / 2 + 4;

  // bar is always full width — contributions is relative to a full year (365)
  const fill = Math.max(4, Math.round((Math.min(total, 365) / 365) * BAR_W));

  const body = [
    `<text x="${PAD}" y="${y}" font-family="'Fira Code',Consolas,'Courier New',monospace" font-size="12" fill="${labelClr}">contributions</text>`,
    `<rect x="${BAR_X}" y="${y - 12}" width="${BAR_W}" height="14" rx="3" fill="${barBg}"/>`,
    `<rect x="${BAR_X}" y="${y - 12}" width="${fill}" height="14" rx="3" fill="${barClr}"/>`,
    `<text x="${VAL_X}" y="${y}" font-family="'Fira Code',Consolas,'Courier New',monospace" font-size="12" fill="${valueClr}">${total}</text>`,
  ].join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>
  ${body}
</svg>`;
}

async function main() {
  const data = await fetchGraphQL(QUERY, { username: USERNAME });
  const total = data.user.contributionsCollection.contributionCalendar.totalContributions;

  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/stats.svg',       generateSVG(total, 'dark'));
  fs.writeFileSync('assets/stats-light.svg', generateSVG(total, 'light'));

  console.log(`✓ stats: ${total} contributions`);
}

main().catch(err => { console.error(err); process.exit(1); });
