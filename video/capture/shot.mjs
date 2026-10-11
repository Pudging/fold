// node capture/shot.mjs <html> <png> [width]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const [, , file, out, width = '1800'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 800 } });
await page.goto(pathToFileURL(file).href);
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
