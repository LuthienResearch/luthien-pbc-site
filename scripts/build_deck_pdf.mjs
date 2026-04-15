#!/usr/bin/env node
// Render site/pitch/index.html to luthien-deck.pdf using Playwright's print emulation.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const deckHtml = resolve(here, '..', 'site', 'pitch', 'index.html');
const outPdf = resolve(here, '..', 'luthien-deck.pdf');

if (!existsSync(deckHtml)) {
  console.error(`Deck HTML not found at ${deckHtml}`);
  process.exit(1);
}

const EXPECTED_FONT_FAMILIES = ['Raleway', 'Lora', 'JetBrains Mono'];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

page.setDefaultTimeout(60_000);
page.setDefaultNavigationTimeout(60_000);

await page.goto(pathToFileURL(deckHtml).href, { waitUntil: 'networkidle' });

// Fonts: Google Fonts is loaded from the network. If it fails, document.fonts.ready
// still resolves (failed loads don't block). Assert the expected families actually loaded.
await page.evaluate(() => document.fonts.ready);
const loadedFamilies = await page.evaluate(() =>
  Array.from(new Set(Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family)))
);
const missing = EXPECTED_FONT_FAMILIES.filter(f => !loadedFamilies.includes(f));
if (missing.length) {
  console.error(`Required fonts failed to load: ${missing.join(', ')}`);
  console.error(`Loaded families: ${loadedFamilies.join(', ') || '(none)'}`);
  await browser.close();
  process.exit(2);
}

// Images: wait for every <img> to complete with non-zero natural dimensions.
await page.waitForFunction(
  () => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0),
  null,
  { timeout: 30_000 }
);

await page.emulateMedia({ media: 'print' });

// Page size comes from @page in the print stylesheet (1280x720). Explicit format
// here would override; let CSS be the single source of truth.
await page.pdf({
  path: outPdf,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

await browser.close();

const { size } = statSync(outPdf);
console.log(`Wrote ${outPdf} (${(size / 1024 / 1024).toFixed(2)} MB)`);
