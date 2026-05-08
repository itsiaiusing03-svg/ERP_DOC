import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const baseUrl = "http://127.0.0.1:4173/deep.html";
const outputDir = path.join(process.cwd(), "qa", "deep-module-review");
const chromeCandidates = [
  process.env.CHROME_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);
const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function getModuleState(page) {
  return page.evaluate(() => {
    const select = document.querySelector("#moduleSelect");
    const selected = select?.selectedOptions?.[0];
    const detail = document.querySelector("#moduleDetail");
    const flowSteps = [...document.querySelectorAll(".flow-step")].map((step) => ({
      title: step.querySelector("h5")?.textContent?.trim() || "",
      description: step.querySelector("p")?.textContent?.trim() || "",
      output: step.querySelector(".flow-output strong")?.textContent?.trim() || "",
      active: step.classList.contains("active"),
      dim: step.classList.contains("dim"),
      ariaPressed: step.querySelector(".flow-step-button")?.getAttribute("aria-pressed") || ""
    }));
    const flowDetail = {
      title: detail?.querySelector(".flow-detail-panel h5")?.textContent?.trim() || "",
      columnCount: detail?.querySelectorAll(".flow-detail-grid > div").length || 0,
      listCount: detail?.querySelectorAll(".flow-detail-lists section").length || 0,
      definitionCount: detail?.querySelectorAll(".flow-detail-panel .step-definitions div").length || 0
    };
    const blocks = [...document.querySelectorAll(".detail-block")].map((block) => ({
      title: block.querySelector("h4")?.textContent?.trim() || "",
      subtitle: block.querySelector(".block-subtitle")?.textContent?.trim() || "",
      itemCount: block.querySelectorAll("li").length,
      noteCount: block.querySelectorAll("li small").length
    }));
    const positionItems = [...document.querySelectorAll(".position-map .position-node")].map((item) => ({
      label: item.querySelector("span")?.textContent?.trim() || "",
      text: item.querySelector("strong")?.textContent?.trim() || "",
      note: item.querySelector("small")?.textContent?.trim() || ""
    }));
    const kpiDisclosures = [...document.querySelectorAll(".kpi-disclosure")].map((item) => ({
      open: item.open,
      itemCount: item.querySelectorAll("li").length
    }));
    const customSections = [...document.querySelectorAll("[data-section-type]")].map((item) => ({
      type: item.getAttribute("data-section-type") || "",
      title: item.querySelector("h4, h5")?.textContent?.trim() || ""
    }));
    const rects = [...document.querySelectorAll(".module-detail, .position-map, .execution-flow, .flow-step, .flow-detail-panel, .detail-block")].map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        width: Math.round(rect.width),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      };
    });

    return {
      id: select?.value || "",
      name: selected?.textContent?.trim() || "",
      optionCount: select?.options?.length || 0,
      summary: detail?.querySelector(".module-summary h3")?.textContent?.trim() || "",
      mission: detail?.querySelector(".mission")?.textContent?.trim() || "",
      compareNote: detail?.querySelector(".concept-note")?.textContent?.trim() || "",
      callout: detail?.querySelector(".detail-callout")?.textContent?.trim() || "",
      flowHeading: detail?.querySelector(".execution-flow h4")?.textContent?.trim() || "",
      positionItems,
      flowSteps,
      flowDetail,
      blocks,
      kpiDisclosures,
      customLayout: detail?.querySelector(".custom-module-detail")?.getAttribute("data-layout") || "",
      customSections,
      oldKeywordGridRemoved: !detail?.querySelector(".detail-grid"),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowingElements: rects.filter((rect) => rect.scrollWidth > rect.clientWidth + 1),
      bodyTextLength: document.body.innerText.length
    };
  });
}

async function reviewViewport(browser, viewportName, viewportOptions) {
  const context = await browser.newContext(viewportOptions);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.text().includes("Failed to load resource") && message.text().includes("404")) return;
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForSelector("#moduleSelect");
  await page.addStyleTag({ content: ".site-header { position: static !important; }" });

  const modules = await page.evaluate(() =>
    [...document.querySelectorAll("#moduleSelect option")].map((option) => ({
      id: option.value,
      name: option.textContent.trim()
    }))
  );

  const results = [];
  for (const module of modules) {
    await page.selectOption("#moduleSelect", module.id);
    await page.waitForFunction((id) => document.querySelector("#moduleSelect")?.value === id, module.id);
    const initialState = await getModuleState(page);

    if (module.id === "overview") {
      // Overview is a navigation hub — confirm the hub renders + a card jumps to its module.
      const hubCardCount = await page.locator(".overview-card").count();
      const sampleCardId = await page.locator(".overview-card").first().getAttribute("data-overview-target");
      await page.locator(".overview-card").first().click();
      await page.waitForFunction((id) => document.querySelector("#moduleSelect")?.value === id, sampleCardId);
      await page.selectOption("#moduleSelect", module.id);
      await page.waitForFunction((id) => document.querySelector("#moduleSelect")?.value === id, module.id);
      const screenshotPath = path.join(outputDir, `${module.id}-${viewportName}.png`);
      await page.locator("#deep").screenshot({ path: screenshotPath });
      results.push({
        ...initialState,
        initialState,
        hubCardCount,
        sampleCardJumpedTo: sampleCardId,
        viewport: viewportName,
        screenshot: screenshotPath
      });
      continue;
    }

    const flowButtonCount = await page.locator(".flow-step-button").count();
    await page.locator(".flow-step-button").nth(Math.min(2, flowButtonCount - 1)).click();
    await page.waitForFunction(() => document.querySelectorAll(".flow-step.active").length === 1);
    const clickedState = await getModuleState(page);
    const screenshotPath = path.join(outputDir, `${module.id}-${viewportName}.png`);
    await page.locator("#deep").screenshot({ path: screenshotPath });
    results.push({ ...clickedState, initialState, viewport: viewportName, screenshot: screenshotPath });
  }

  await context.close();
  return { viewport: viewportName, modules: results, errors };
}

await ensureDir(outputDir);

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const desktop = await reviewViewport(browser, "desktop", { viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const mobile = await reviewViewport(browser, "mobile", devices["iPhone 13"]);
await browser.close();

const report = {
  checkedAt: new Date().toISOString(),
  url: baseUrl,
  desktop,
  mobile
};

const reportPath = path.join(outputDir, "report.json");
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  report: reportPath,
  desktopModules: desktop.modules.length,
  mobileModules: mobile.modules.length,
  desktopErrors: desktop.errors,
  mobileErrors: mobile.errors
}, null, 2));
