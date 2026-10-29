#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const appRoot = path.resolve(__dirname, "..", "app");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png"
};

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(appRoot, relative);
    if (filePath !== appRoot && !filePath.startsWith(appRoot + path.sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function percentile(values, fraction) {
  const sorted = values.slice().sort((left, right) => left - right);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function round(number) {
  return Math.round(number * 100) / 100;
}

async function sampleNavigation(page, quality, frameCount) {
  const raw = await page.evaluate(async ({ quality, frameCount }) => {
    document.body.setAttribute("data-quality", quality);
    const first = document.querySelector("#favoritesRail .app-tile");
    first.focus();

    const dispatchKey = (key, keyCode) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      Object.defineProperty(event, "keyCode", { get: () => keyCode });
      document.dispatchEvent(event);
    };

    const longTasks = [];
    let observer = null;
    if (typeof PerformanceObserver === "function") {
      try {
        observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => longTasks.push(entry.duration));
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch (error) {}
    }

    const intervals = [];
    const start = performance.now();
    let previous = null;
    let index = 0;
    await new Promise((resolve) => {
      function frame(timestamp) {
        if (previous !== null) intervals.push(timestamp - previous);
        previous = timestamp;
        if (index % 3 === 0) {
          const moveRight = Math.floor(index / 3) % 2 === 0;
          dispatchKey(moveRight ? "ArrowRight" : "ArrowLeft", moveRight ? 39 : 37);
        }
        index += 1;
        if (index < frameCount) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    if (observer) observer.disconnect();
    return {
      intervals,
      longTasks,
      elapsed: performance.now() - start,
      finalFocus: document.activeElement && document.activeElement.getAttribute("data-app-id")
    };
  }, { quality, frameCount });

  return {
    quality,
    frames: raw.intervals.length,
    elapsedMs: round(raw.elapsed),
    averageFrameMs: round(raw.intervals.reduce((sum, value) => sum + value, 0) / raw.intervals.length),
    p95FrameMs: round(percentile(raw.intervals, 0.95)),
    maxFrameMs: round(Math.max(...raw.intervals)),
    framesOver33ms: raw.intervals.filter((value) => value > 33.4).length,
    framesOver50ms: raw.intervals.filter((value) => value > 50).length,
    longTasks: raw.longTasks.length,
    longestTaskMs: round(raw.longTasks.length ? Math.max(...raw.longTasks) : 0),
    finalFocus: raw.finalFocus
  };
}

async function samplePanels(page, quality, cycles) {
  return page.evaluate(async ({ quality, cycles }) => {
    document.body.setAttribute("data-quality", quality);
    const first = document.querySelector("#favoritesRail .app-tile");
    first.focus();
    const dispatchKey = (key, keyCode) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      Object.defineProperty(event, "keyCode", { get: () => keyCode });
      document.dispatchEvent(event);
    };
    const intervals = [];
    const longTasks = [];
    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => longTasks.push(entry.duration));
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (error) {}

    let previous = null;
    let frameIndex = 0;
    let nextToggle = 0;
    let drawerOpen = false;
    const totalFrames = cycles * 28;
    await new Promise((resolve) => {
      function frame(timestamp) {
        if (previous !== null) intervals.push(timestamp - previous);
        previous = timestamp;
        if (frameIndex >= nextToggle) {
          dispatchKey(drawerOpen ? "Escape" : "ArrowDown", drawerOpen ? 27 : 40);
          drawerOpen = !drawerOpen;
          nextToggle += 14;
        }
        frameIndex += 1;
        if (frameIndex < totalFrames) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    if (drawerOpen) dispatchKey("Escape", 27);
    if (observer) observer.disconnect();
    const sorted = intervals.slice().sort((left, right) => left - right);
    const at = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] || 0;
    return {
      quality,
      frames: intervals.length,
      averageFrameMs: intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
      p95FrameMs: at(0.95),
      maxFrameMs: Math.max.apply(Math, intervals),
      framesOver33ms: intervals.filter((value) => value > 33.4).length,
      framesOver50ms: intervals.filter((value) => value > 50).length,
      longTasks: longTasks.length,
      longestTaskMs: longTasks.length ? Math.max.apply(Math, longTasks) : 0
    };
  }, { quality, cycles }).then((raw) => Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])));
}

async function run() {
  const server = await startServer();
  const { port } = server.address();
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows"
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
    await page.waitForSelector("#favoritesRail .app-tile:nth-child(8)");
    await page.waitForFunction(() => document.querySelector("#platformStatus").textContent === "Modo computador");
    await page.waitForTimeout(250);

    const startup = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
      };
      const filtered = Array.from(document.querySelectorAll("*"))
        .filter((element) => visible(element))
        .filter((element) => {
          const style = getComputedStyle(element);
          const standard = style.backdropFilter || "";
          const webkit = style.webkitBackdropFilter || "";
          return (standard && standard !== "none") || (webkit && webkit !== "none");
        });
      return {
        domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : 0,
        loadMs: navigation ? navigation.loadEventEnd : 0,
        domElements: document.querySelectorAll("*").length,
        visibleBackdropSurfaces: filtered.map((element) => element.id || element.className || element.tagName)
      };
    });

    const balanced = await sampleNavigation(page, "balanced", 180);
    const light = await sampleNavigation(page, "light", 180);
    const panelsBalanced = await samplePanels(page, "balanced", 6);
    const panelsLight = await samplePanels(page, "light", 6);
    const report = {
      environment: "Chromium headless 1920x1080; use only for before/after comparison",
      startup: {
        domContentLoadedMs: round(startup.domContentLoadedMs),
        loadMs: round(startup.loadMs),
        domElements: startup.domElements,
        visibleBackdropSurfaces: startup.visibleBackdropSurfaces
      },
      navigation: { balanced, light },
      panels: { balanced: panelsBalanced, light: panelsLight },
      errors
    };

    console.log(JSON.stringify(report, null, 2));
    if (errors.length) throw new Error(`Erros do navegador: ${errors.join(" | ")}`);
    if (balanced.p95FrameMs > 100 || panelsBalanced.p95FrameMs > 100 || panelsLight.p95FrameMs > 100) {
      throw new Error("O percentil 95 ultrapassou o limite de segurança de 100 ms.");
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(`FAIL performance-smoke: ${error.message}`);
  process.exitCode = 1;
});
