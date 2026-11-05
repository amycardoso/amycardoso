#!/usr/bin/env node
'use strict';

const fs = require('fs');

const MANIFEST_URL = 'https://raw.githubusercontent.com/amycardoso/creative-coding/main/manifest.json';
const GALLERY_URL  = 'https://amycardoso.github.io/creative-coding-gallery/';
// The gallery publishes a small preview of each piece (preview.gif for
// recordings, thumb.webp for stills) and lists them in media/index.json.
// The recordings themselves are MP4, which an <img> can't show.
const MEDIA_INDEX  = `${GALLERY_URL}media/index.json`;
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

  const mediaRes = await fetch(MEDIA_INDEX);
  if (!mediaRes.ok) throw new Error(`Failed to fetch media index: ${mediaRes.status}`);
  const media = await mediaRes.json();

  // Newest first, only pieces that have a preview, take top COUNT
  const latest = list
    .filter(s => media[s.slug] && media[s.slug].preview)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, COUNT);
  if (latest.length === 0) throw new Error('No previews in the gallery media index — leaving the README as is');

  // Build gallery HTML — one row of thumbnails, each linking to its page
  const images = latest
    .map(s => {
      const src = `${GALLERY_URL}media/${s.slug}/${media[s.slug].preview}`;
      const alt = s.title.toLowerCase();
      return `<a href="${GALLERY_URL}${s.slug}/"><img src="${src}" height="100" alt="${alt}" /></a>`;
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
