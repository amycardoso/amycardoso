#!/usr/bin/env node
'use strict';

const fs = require('fs');

const MANIFEST_URL = 'https://raw.githubusercontent.com/amycardoso/creative-coding/main/manifest.json';
const RAW_BASE     = 'https://raw.githubusercontent.com/amycardoso/creative-coding/main/';
const GALLERY_URL  = 'https://amycardoso.github.io/creative-coding-gallery/';
const README_PATH  = 'README.md';
const COUNT        = 6;

async function main() {
  // Fetch manifest (public repo — no auth needed)
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const sketches = await res.json();

  // Manifest is { sketches: [...] } — extract the array
  const list = Array.isArray(sketches) ? sketches : sketches.sketches;
  if (!Array.isArray(list)) throw new Error('Unexpected manifest shape');

  // Sort by date descending, take top COUNT
  const latest = list
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, COUNT);

  // Build gallery HTML — one row of linked thumbnails
  const images = latest
    .map(s => {
      const src = `${RAW_BASE}${s.media}`;
      const alt = s.title.toLowerCase();
      return `<a href="${GALLERY_URL}"><img src="${src}" width="100" alt="${alt}" /></a>`;
    })
    .join(' ');

  // Replace content between markers in README
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const updated = readme.replace(
    /<!--GALLERY_START-->[\s\S]*?<!--GALLERY_END-->/,
    `<!--GALLERY_START-->\n${images}\n<!--GALLERY_END-->`
  );

  if (updated === readme) {
    console.log('Gallery unchanged — nothing to commit.');
    return;
  }

  fs.writeFileSync(README_PATH, updated);
  console.log(`✓ Gallery updated with: ${latest.map(s => s.title).join(', ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
