import { chromium } from 'playwright';

// Run against local production builds, sequentially, on the same machine.
// Example: node scripts/measure-system-performance.mjs http://127.0.0.1:4343 http://127.0.0.1:4346
const urls = process.argv.slice(2);
if (!urls.length) throw new Error('Pass one or more local graph preview URLs.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const url of urls) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => {
      window.graphLongTasks = [];
      new PerformanceObserver(list => window.graphLongTasks.push(...list.getEntries().map(e => e.duration))).observe({ type: 'longtask' });
    });
    await page.goto(url);
    await page.locator('[data-testid="system-graph-stage"][data-ready="true"]').waitFor({ timeout: 60000 });
    await page.waitForTimeout(1000);
    const timings = await page.locator('.system-stage .graph-canvas').evaluate(async element => {
      const cy = element._cyreg.cy;
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const summary = values => {
        values.sort((a, b) => a - b);
        return { samples: values.length, medianMs: +values[Math.floor(values.length / 2)].toFixed(1), p95Ms: +values[Math.floor(values.length * .95)].toFixed(1) };
      };
      const pan = [], hover = [];
      for (let i = 0; i < 24; i++) {
        const start = performance.now();
        cy.panBy({ x: i % 2 ? -3 : 3, y: 0 });
        await frames(); pan.push(performance.now() - start);
      }
      await sleep(350);
      for (let i = 0; i < 12; i++) {
        const node = cy.nodes()[i * 20], start = performance.now();
        node.emit('mouseover'); await frames(); hover.push(performance.now() - start);
        node.emit('mouseout'); await sleep(250);
      }
      return { panTwoFrames: summary(pan), hoverTwoFrames: summary(hover), corpus: { nodes: cy.nodes().length, edges: cy.edges().length } };
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => { window.graphLongTasks = []; });
    await page.mouse.move(1050, 650);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -90); await page.waitForTimeout(250); }
    await page.mouse.move(1100, 700); await page.mouse.down();
    await page.mouse.move(980, 700, { steps: 12 }); await page.mouse.up();
    await page.waitForTimeout(1000);
    const gestures = await page.evaluate(() => ({ longTasks: window.graphLongTasks.length, maximumTaskMs: Math.max(0, ...window.graphLongTasks), totalLongTaskMs: window.graphLongTasks.reduce((sum, ms) => sum + ms, 0) }));
    console.log(JSON.stringify({ url, ...timings, gestures }));
    await page.close();
  }
} finally { await browser.close(); }
