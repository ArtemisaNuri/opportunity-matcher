// Usage: node dev/preview/shoot.mjs <route> <theme light|dark> <out.png> [width] [height] [--full] [--click "selector"]...
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire("/home/claude/.npm-global/lib/node_modules/");
const { chromium } = require("playwright");
const [route = "/", theme = "light", out = "shot.png", width = "1440", height = "900", ...rest] = process.argv.slice(2);
const full = rest.includes("--full");
const clicks = [];
for (let i = 0; i < rest.length; i++) if (rest[i] === "--click") clicks.push(rest[++i]);
const outDir = process.env.PREVIEW_OUT ?? path.resolve(new URL(".", import.meta.url).pathname, "../.out");
const file = "file://" + path.join(outDir, "index.html");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: +height }, colorScheme: theme });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(file + "#/");
await page.evaluate((t) => { localStorage.clear(); localStorage.setItem("theme", t); }, theme);
await page.goto(file + "#" + route);
await page.reload();
await page.waitForTimeout(+(process.env.SHOOT_WAIT ?? 1200));
for (const sel of clicks) { await page.click(sel); await page.waitForTimeout(700); }
await page.screenshot({ path: out, fullPage: full });
const err = await page.evaluate(() => window.__previewError);
if (err) errors.push(err);
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no errors");
await browser.close();
