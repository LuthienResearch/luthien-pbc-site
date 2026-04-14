#!/usr/bin/env node
// Render site/pitch/index.html to luthien-deck.pdf using Playwright's print emulation.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const deckHtml = resolve(here, '..', 'site', 'pitch', 'index.html');
const outPdf = resolve(here, '..', 'luthien-deck.pdf');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

await page.goto(pathToFileURL(deckHtml).href, { waitUntil: 'networkidle' });

// Google Fonts are pulled from the network; give them a beat to settle.
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts && document.fonts.ready);

await page.emulateMedia({ media: 'print' });

await page.pdf({
  path: outPdf,
  width: '1280px',
  height: '720px',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`Wrote ${outPdf}`);
