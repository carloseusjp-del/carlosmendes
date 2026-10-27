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
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body)
  });
}

function catalogResults(prefix, mediaType) {
  return [1, 2, 3, 4].map((number) => ({
    id: number,
    media_type: mediaType,
    title: mediaType === "movie" ? `${prefix} Filme ${number}` : undefined,
    name: mediaType === "tv" ? `${prefix} Série ${number}` : undefined,
    release_date: mediaType === "movie" ? "2026-01-02" : undefined,
    first_air_date: mediaType === "tv" ? "2025-03-04" : undefined,
    vote_average: 7 + number / 10,
    overview: `Sinopse de teste ${number}`,
    backdrop_path: `/backdrop-${prefix}-${number}.jpg`,
    poster_path: `/poster-${prefix}-${number}.jpg`,
    adult: false
  }));
}

async function run() {
  const server = await startServer();
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const browserErrors = [];
  const apiPaths = [];

  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });

  await page.route("https://api.themoviedb.org/**", async (route) => {
    const url = new URL(route.request().url());
    apiPaths.push(url.pathname);
    if (url.pathname.endsWith("/configuration")) {
      await json(route, { images: { secure_base_url: "https://image.tmdb.org/t/p/" } });
      return;
    }
    if (url.pathname.includes("/trending/movie/")) {
      await json(route, { results: catalogResults("Cinema", "movie") });
      return;
    }
    if (url.pathname.includes("/trending/tv/")) {
      await json(route, { results: catalogResults("TV", "tv") });
      return;
    }
    if (url.pathname.includes("/trending/all/")) {
      const mixed = catalogResults("Mix", "movie").slice(0, 2)
        .concat(catalogResults("Mix", "tv").slice(0, 2));
      await json(route, { results: mixed });
      return;
    }
    await json(route, { status_message: "Unexpected mock endpoint" }, 404);
  });

  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/png",
    body: onePixelPng
  }));

  try {
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.waitForSelector("#favoritesRail .app-tile:nth-child(8)");
    assert(await page.locator("#favoritesRail .app-tile").count() === 8, "O fallback deve exibir oito aplicativos.");
    assert(await page.locator("#catalogStatus").textContent() === "Não configurada", "O catálogo sem chave deve ficar no modo local.");
    assert(await page.locator("#storyTitle0").textContent() === "Depois da chuva", "O destaque local deve permanecer sem chave.");
    assert(await page.locator("#platformStatus").textContent() === "Modo computador", "O navegador deve indicar modo computador.");

    await page.locator("#favoritesRail .app-tile").first().focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(() => document.body.classList.contains("drawer-open"));
    assert(await page.locator("#quickDrawer").getAttribute("aria-hidden") === "false", "Seta para baixo deve abrir Entradas e atalhos.");
    await page.waitForTimeout(330);
    assert(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("drawer-focus")), "O foco deve entrar na gaveta.");
    await page.locator('[data-quick="Todos os apps"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.body.classList.contains("all-apps-open"));
    assert(await page.locator("#allAppsGrid .app-tile").count() === 8, "Todos os apps deve exibir o catálogo disponível.");
    assert(await page.locator("#allAppsPanel").getAttribute("aria-hidden") === "false", "A biblioteca deve ser acessível pelo controle.");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.body.classList.contains("all-apps-open"));

    await page.locator("#settingsButton").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.body.classList.contains("settings-open"));
    assert(await page.locator("#settingsPanel").getAttribute("aria-hidden") === "false", "OK deve abrir os ajustes.");
    await page.locator('[data-wallpaper-option="sand"]').focus();
    await page.keyboard.press("Enter");
    const wallpaperState = await page.evaluate(() => ({
      wallpaper: document.body.getAttribute("data-wallpaper"),
      activeId: document.activeElement && document.activeElement.id,
      activeClass: document.activeElement && document.activeElement.className
    }));
    assert(wallpaperState.wallpaper === "sand", `O papel de parede deve mudar pelo controle (${JSON.stringify(wallpaperState)}).`);
    await page.locator("#motionToggle").focus();
    await page.waitForTimeout(220);
    const settingsFocusVisible = await page.evaluate(() => {
      const target = document.querySelector("#motionToggle").getBoundingClientRect();
      const viewport = document.querySelector(".settings-scroll").getBoundingClientRect();
      return target.top >= viewport.top && target.bottom <= viewport.bottom;
    });
    assert(settingsFocusVisible, "O painel deve rolar para manter o foco remoto visível.");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: "networkidle" });
    assert(await page.locator("body").getAttribute("data-wallpaper") === "sand", "A aparência deve persistir após reiniciar.");

    await page.locator("#settingsButton").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.body.classList.contains("settings-open"));
    const credential = "1234567890abcdef1234567890abcdef";
    await page.locator("#tmdbCredential").fill(credential);
    await page.locator("#tmdbCredential").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#storyTitle0").textContent === "Mix Filme 1");
    assert(await page.locator("#catalogStatus").textContent() === "Configurada", "Uma chave aceita deve ativar o catálogo.");
    assert(await page.evaluate(() => localStorage.getItem("com.carlosmendes.mendeshome.tmdb-credential.v1") !== null), "A credencial validada deve ser salva localmente.");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.body.classList.contains("settings-open"));

    await page.locator('[data-catalog-mode="movies"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#storyTitle0").textContent === "Cinema Filme 1");
    await page.locator('[data-catalog-mode="series"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#storyTitle0").textContent === "TV Série 1");
    assert(apiPaths.some((item) => item.includes("/trending/all/")), "O teste deve consultar Descobrir.");
    assert(apiPaths.some((item) => item.includes("/trending/movie/")), "A aba Filmes deve consultar filmes.");
    assert(apiPaths.some((item) => item.includes("/trending/tv/")), "A aba Séries deve consultar séries.");

    assert(browserErrors.length === 0, browserErrors.join("\n") || "O navegador não deve produzir erros.");

    const webosContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    await webosContext.addInitScript(() => {
      window.PalmSystem = {
        identifier: "com.carlosmendes.mendeshome 1000",
        launchParams: "{}"
      };
      window.__lunaCalls = [];
      window.PalmServiceBridge = function PalmServiceBridge() {};
      window.PalmServiceBridge.prototype.call = function call(uri, rawParameters) {
        const bridge = this;
        const parameters = JSON.parse(rawParameters || "{}");
        window.__lunaCalls.push({ uri, parameters });
        let response = { returnValue: true };
        if (uri.includes("listLaunchPoints")) {
          response.launchPoints = Array.from({ length: 10 }, (_, index) => ({
            id: `test.app.${index + 1}`,
            title: `Aplicativo ${index + 1}`,
            visible: true
          }));
        }
        setTimeout(() => bridge.onservicecallback(JSON.stringify(response)), 5);
      };
      window.PalmServiceBridge.prototype.cancel = function cancel() {};
    });
    const webosPage = await webosContext.newPage();
    const webosErrors = [];
    webosPage.on("pageerror", (error) => webosErrors.push(`pageerror: ${error.message}`));
    webosPage.on("console", (message) => {
      if (message.type() === "error") webosErrors.push(`console: ${message.text()}`);
    });
    await webosPage.goto(origin, { waitUntil: "networkidle" });
    await webosPage.waitForFunction(() => document.querySelector("#platformStatus").textContent === "Apps conectados");
    assert(await webosPage.locator("#favoritesRail .app-tile").count() === 8, "O dock da TV deve limitar os favoritos a oito.");
    assert(await webosPage.locator("#allAppsGrid .app-tile").count() === 10, "A biblioteca deve listar todos os launch points retornados pela TV.");
    await webosPage.locator("#favoritesRail .app-tile").first().focus();
    await webosPage.keyboard.press("ArrowDown");
    await webosPage.waitForFunction(() => document.body.classList.contains("drawer-open"));
    await webosPage.locator('[data-quick="Todos os apps"]').focus();
    await webosPage.keyboard.press("Enter");
    await webosPage.waitForFunction(() => document.body.classList.contains("all-apps-open"));
    await webosPage.locator('[data-library-app-id="test.app.9"]').focus();
    await webosPage.keyboard.press("e");
    assert(await webosPage.locator('#favoritesRail [data-app-id="test.app.9"]').count() === 1, "A tecla verde deve permitir fixar um app da biblioteca no dock.");
    await webosPage.keyboard.press("Escape");
    await webosPage.locator("#favoritesRail .app-tile").first().click();
    await webosPage.waitForFunction(() => window.__lunaCalls.some((call) => call.uri.includes("/launch")));
    assert(await webosPage.evaluate(() => window.__lunaCalls.some((call) => call.uri.includes("/launch") && call.parameters.id === "test.app.1")), "OK em um aplicativo deve pedir sua abertura ao webOS.");
    assert(webosErrors.length === 0, webosErrors.join("\n") || "O modo webOS simulado não deve produzir erros.");
    await webosContext.close();

    console.log("PASS browser-smoke: fallback, controle, biblioteca, ajustes, persistência, TMDB e bridge webOS.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(`FAIL browser-smoke: ${error.message}`);
  process.exitCode = 1;
});
