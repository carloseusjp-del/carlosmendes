(function () {
  "use strict";

  var platform = window.MendesPlatform;
  var catalog = window.MendesCatalog;
  var STORAGE_KEY = "com.carlosmendes.mendeshome.state.v1";
  var SCHEMA_VERSION = 2;
  var tvRuntime = platform.isWebOS();
  var WALLPAPERS = ["wall", "mist", "sand", "night"];
  var WALLPAPER_NAMES = { wall:"Parede iluminada", mist:"Névoa", sand:"Areia", night:"Noite" };
  var QUALITY_NAMES = { light:"Leve", balanced:"Equilibrado", full:"Máximo" };
  var COLOR_KEYS = { GREEN:404, BLUE:406 };
  var editMode = false;
  var drawerOpen = false;
  var allAppsOpen = false;
  var settingsOpen = false;
  var lastMainFocus = null;
  var lastDockFocus = null;
  var toastTimer = null;
  var saveTimer = null;
  var allAppsCleanupTimer = null;
  var stateReadOnly = false;
  var performanceMigrationPending = false;
  var allAppsDirty = true;
  var visualFocusedElement = null;
  var currentCatalogMode = "discover";
  var catalogRequestId = 0;
  var platformDetail = "Inicializando";
  var allApps = [];
  var apps = [];

  document.documentElement.classList.toggle("webos-runtime", tvRuntime);

  var icons = {
    cinema:'<svg viewBox="0 0 48 48"><path d="M15 11v26M33 11v26M10 16h28M10 32h28M10 11h28v26H10zM15 11l4 5m5-5 4 5m5-5 4 5"/></svg>',
    music:'<svg viewBox="0 0 48 48"><path d="M18 33V15l20-4v18M18 20l20-4"/><ellipse cx="13" cy="35" rx="5" ry="4"/><ellipse cx="33" cy="31" rx="5" ry="4"/></svg>',
    photos:'<svg viewBox="0 0 48 48"><rect x="9" y="10" width="30" height="28" rx="6"/><circle cx="29" cy="19" r="4"/><path d="m12 34 9-10 6 6 4-4 6 8"/></svg>',
    tv:'<svg viewBox="0 0 48 48"><rect x="7" y="12" width="34" height="25" rx="6"/><path d="m18 7 6 5 6-5M18 41h12m3-21 9 5-9 5z"/></svg>',
    web:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8c5 5 7 10 7 16s-2 11-7 16c-5-5-7-10-7-16s2-11 7-16z"/></svg>',
    games:'<svg viewBox="0 0 48 48"><path d="M15 18h18c5 0 9 5 9 11 0 5-3 9-7 9-3 0-5-4-7-6h-8c-2 2-4 6-7 6-4 0-7-4-7-9 0-6 4-11 9-11zM14 27h8M18 23v8M32 25h.1M36 29h.1"/></svg>',
    home:'<svg viewBox="0 0 48 48"><path d="M9 23 24 10l15 13v15H28V27h-8v11H9zM34 14v-3h5v8"/></svg>',
    files:'<svg viewBox="0 0 48 48"><path d="M7 16h14l4 5h16v17H7zM7 16v-5h13l4 5"/></svg>'
  };

  var rail = document.getElementById("favoritesRail");
  var settingsPanel = document.getElementById("settingsPanel");
  var quickDrawer = document.getElementById("quickDrawer");
  var allAppsPanel = document.getElementById("allAppsPanel");
  var allAppsGrid = document.getElementById("allAppsGrid");
  var showcase = document.getElementById("showcase");
  var scrim = document.getElementById("scrim");
  var toast = document.getElementById("toast");
  var catalogStatus = document.getElementById("catalogStatus");
  var credentialInput = document.getElementById("tmdbCredential");
  var storyCards = Array.prototype.slice.call(document.querySelectorAll("[data-story-slot]"));
  var fallbackStories = storyCards.map(function (card, index) {
    var badge = document.getElementById("storyBadge" + index);
    return {
      title:document.getElementById("storyTitle" + index).textContent,
      meta:document.getElementById("storyMeta" + index).textContent,
      story:card.getAttribute("data-story"),
      badge:badge ? badge.textContent : "",
      badgeHidden:badge ? badge.hidden : true
    };
  });

  function defaultState() {
    return {
      schemaVersion:SCHEMA_VERSION,
      appearance:{ wallpaper:"wall", glassIntensity:72, blur:8, quality:tvRuntime ? "light" : "balanced", motion:true },
      dock:{ order:[], favorites:[] }
    };
  }

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); }
    catch (error) { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { return false; }
  }

  function clampStep(value, minimum, maximum, step, fallback) {
    var number = Number(value);
    if (!isFinite(number)) number = fallback;
    number = Math.max(minimum, Math.min(maximum, number));
    return Math.round(number / step) * step;
  }

  function uniqueStrings(value) {
    var seen = {};
    return (Array.isArray(value) ? value : []).filter(function (item) {
      if (typeof item !== "string" || !item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function sanitizeState(raw) {
    var clean = defaultState();
    var appearance = raw && raw.appearance || {};
    var dock = raw && raw.dock || {};
    clean.appearance.wallpaper = WALLPAPERS.indexOf(appearance.wallpaper) >= 0 ? appearance.wallpaper : clean.appearance.wallpaper;
    clean.appearance.quality = QUALITY_NAMES[appearance.quality] ? appearance.quality : clean.appearance.quality;
    clean.appearance.glassIntensity = clampStep(appearance.glassIntensity, 40, 90, 2, 72);
    clean.appearance.blur = clampStep(appearance.blur, 0, 12, 2, 8);
    clean.appearance.motion = typeof appearance.motion === "boolean" ? appearance.motion : true;
    clean.dock.order = uniqueStrings(dock.order);
    clean.dock.favorites = uniqueStrings(dock.favorites);
    return clean;
  }

  function migrateState(raw) {
    if (!raw) return raw;
    var version = Number(raw.schemaVersion) || 1;
    if (version < 2) {
      raw.appearance = raw.appearance || {};
      if (tvRuntime) raw.appearance.quality = "light";
      raw.schemaVersion = 2;
      performanceMigrationPending = true;
    }
    return raw;
  }

  function loadState() {
    var raw = null;
    try { raw = JSON.parse(safeStorageGet(STORAGE_KEY) || "null"); }
    catch (error) { raw = null; }
    if (raw && Number(raw.schemaVersion) > SCHEMA_VERSION) {
      stateReadOnly = true;
      return defaultState();
    }
    if (!raw) {
      var legacyOrder = null;
      try { legacyOrder = JSON.parse(safeStorageGet("mendes-home.app-order.v1") || "[]"); }
      catch (error) { legacyOrder = []; }
      var legacyTheme = safeStorageGet("mendes-home.theme.v1");
      raw = defaultState();
      raw.dock.order = Array.isArray(legacyOrder) ? legacyOrder : [];
      raw.appearance.wallpaper = legacyTheme === "sunset" ? "sand" : legacyTheme === "graphite" ? "night" : "wall";
    }
    return sanitizeState(migrateState(raw));
  }

  var state = loadState();

  function flushSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (stateReadOnly) return;
    if (!safeStorageSet(STORAGE_KEY, JSON.stringify(state))) showToast("As preferências não puderam ser salvas");
  }

  function queueSave() {
    if (stateReadOnly) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 220);
  }

  function initials(title) {
    var words = String(title || "App").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "AP";
    return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : (words[0][0] + words[1][0]).toUpperCase();
  }

  function mergeAppOrder(items, savedOrder) {
    var byId = {};
    var seen = {};
    var result = [];
    items.forEach(function (app) { byId[app.id] = app; });
    uniqueStrings(savedOrder).forEach(function (id) {
      if (byId[id] && !seen[id]) { result.push(byId[id]); seen[id] = true; }
    });
    items.forEach(function (app) {
      if (!seen[app.id]) { result.push(app); seen[app.id] = true; }
    });
    return result;
  }

  function selectDockApps(items) {
    var preferred = state.dock.favorites.length ? state.dock.favorites : state.dock.order.slice(0, 8);
    var byId = {};
    var selected = [];
    items.forEach(function (app) { byId[app.id] = app; });
    preferred.forEach(function (id) {
      if (byId[id] && selected.length < 8 && selected.indexOf(byId[id]) < 0) selected.push(byId[id]);
    });
    items.forEach(function (app) {
      if (selected.length < 8 && selected.indexOf(app) < 0) selected.push(app);
    });
    return selected;
  }

  function updateSavedOrder() {
    var dockIds = apps.map(function (app) { return app.id; });
    var tail = state.dock.order.concat(allApps.map(function (app) { return app.id; })).filter(function (id) {
      return dockIds.indexOf(id) < 0;
    });
    state.dock.order = uniqueStrings(dockIds.concat(tail));
    state.dock.favorites = dockIds.slice();
    queueSave();
  }

  function renderApps(focusId) {
    rail.textContent = "";
    rail.classList.toggle("is-sparse", apps.length < 8);
    apps.forEach(function (app) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "app-tile focusable" + (editMode ? " is-editing" : "");
      button.setAttribute("data-app-id", app.id);
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", app.title);
      button.style.setProperty("--app-a", app.a || "#4f7780");
      button.style.setProperty("--app-b", app.b || "#29464e");

      var icon = document.createElement("span");
      icon.className = "app-icon";
      var fallback = document.createElement("span");
      fallback.className = "app-fallback";
      if (icons[app.iconKey]) fallback.innerHTML = icons[app.iconKey];
      else {
        var letters = document.createElement("span");
        letters.className = "app-initials";
        letters.textContent = initials(app.title);
        fallback.appendChild(letters);
      }
      icon.appendChild(fallback);
      if (app.icon) {
        var image = document.createElement("img");
        image.alt = "";
        image.decoding = "async";
        image.onload = function () { icon.classList.add("has-image"); };
        image.onerror = function () { image.removeAttribute("src"); icon.classList.remove("has-image"); };
        image.src = app.icon;
        icon.appendChild(image);
      }

      var title = document.createElement("span");
      title.className = "app-name";
      title.textContent = app.title;
      button.appendChild(icon);
      button.appendChild(title);
      button.addEventListener("mouseenter", function () { focusElement(button); });
      button.addEventListener("click", function () {
        if (editMode) { toggleEditMode(false); return; }
        launchDockApp(app);
      });
      rail.appendChild(button);
    });
    if (focusId) focusElement(rail.querySelector('[data-app-id="' + focusId + '"]'));
  }

  function updateAllAppsSummary() {
    document.getElementById("allAppsCount").textContent = allApps.length + (allApps.length === 1 ? " aplicativo" : " aplicativos") + " · Verde: fixar no dock";
  }

  function renderAllApps(focusId) {
    allAppsGrid.textContent = "";
    updateAllAppsSummary();
    allApps.forEach(function (app) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "app-tile all-apps-tile focusable all-apps-focus";
      if (apps.some(function (favorite) { return favorite.id === app.id; })) button.classList.add("is-favorite");
      button.setAttribute("data-library-app-id", app.id);
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", app.title);
      button.style.setProperty("--app-a", app.a || "#4f7780");
      button.style.setProperty("--app-b", app.b || "#29464e");

      var icon = document.createElement("span");
      icon.className = "app-icon";
      var fallback = document.createElement("span");
      fallback.className = "app-fallback";
      if (icons[app.iconKey]) fallback.innerHTML = icons[app.iconKey];
      else {
        var letters = document.createElement("span");
        letters.className = "app-initials";
        letters.textContent = initials(app.title);
        fallback.appendChild(letters);
      }
      icon.appendChild(fallback);
      if (app.icon) {
        var image = document.createElement("img");
        image.alt = "";
        image.decoding = "async";
        image.loading = "lazy";
        image.onload = function () { icon.classList.add("has-image"); };
        image.onerror = function () { image.removeAttribute("src"); icon.classList.remove("has-image"); };
        image.src = app.icon;
        icon.appendChild(image);
      }

      var title = document.createElement("span");
      title.className = "app-name";
      title.textContent = app.title;
      button.appendChild(icon);
      button.appendChild(title);
      if (button.classList.contains("is-favorite")) {
        var pin = document.createElement("span");
        pin.className = "favorite-pin";
        pin.textContent = "NO DOCK";
        button.appendChild(pin);
      }
      button.addEventListener("mouseenter", function () { focusElement(button); });
      button.addEventListener("click", function () { launchDockApp(app); });
      allAppsGrid.appendChild(button);
    });
    allAppsDirty = false;
    if (focusId) focusElement(allAppsGrid.querySelector('[data-library-app-id="' + focusId + '"]'));
  }

  function setPlatformStatus(label, mode, detail) {
    var dot = document.getElementById("platformDot");
    document.getElementById("platformStatus").textContent = label;
    dot.classList.toggle("is-limited", mode === "limited");
    dot.classList.toggle("is-offline", mode === "offline");
    platformDetail = detail || label;
  }

  function loadInstalledApps() {
    setPlatformStatus(platform.isWebOS() ? "Lendo apps" : "Modo computador", platform.isWebOS() ? "limited" : "offline", "Consultando aplicativos disponíveis");
    return platform.listApps().then(function (result) {
      var focusedDockId = document.activeElement && document.activeElement.getAttribute("data-app-id");
      allApps = mergeAppOrder(result.apps, state.dock.order);
      apps = selectDockApps(allApps);
      if (!apps.length) apps = platform.demoApps();
      renderApps();
      allAppsDirty = true;
      updateAllAppsSummary();
      if (allAppsOpen) renderAllApps();
      if (focusedDockId) focusElement(rail.querySelector('[data-app-id="' + focusedDockId + '"]') || rail.querySelector(".app-tile"));
      if (result.source === "launchPoints" || result.source === "apps") {
        setPlatformStatus("Apps conectados", "online", allApps.length + " aplicativos retornados pela TV");
      } else if (result.source === "knownApps") {
        setPlatformStatus("Apps verificados", "limited", allApps.length + " aplicativos conhecidos encontrados; a lista completa foi limitada pelo webOS");
      } else if (result.source === "limited") {
        setPlatformStatus("Acesso limitado", "limited", "O webOS não liberou a lista; o dock está em modo demonstrativo");
      } else {
        setPlatformStatus("Modo computador", "offline", "A integração com aplicativos será ativada dentro da TV");
      }
    }).catch(function () {
      var focusedDockId = document.activeElement && document.activeElement.getAttribute("data-app-id");
      allApps = platform.demoApps();
      apps = allApps.slice(0, 8);
      renderApps();
      allAppsDirty = true;
      updateAllAppsSummary();
      if (allAppsOpen) renderAllApps();
      if (focusedDockId) focusElement(rail.querySelector(".app-tile"));
      setPlatformStatus("Acesso limitado", "limited", "Não foi possível consultar os aplicativos; o dock está em modo demonstrativo");
    });
  }

  function launchDockApp(app) {
    setPlatformStatus("Abrindo app", "online", "Abrindo " + app.title);
    platform.launchApp(app).then(function () {
      setPlatformStatus("Apps conectados", "online", app.title + " foi enviado ao Application Manager");
    }).catch(function (error) {
      setPlatformStatus(platform.isWebOS() ? "Acesso limitado" : "Modo computador", platform.isWebOS() ? "limited" : "offline", error.message);
      showToast(error.message || "Não foi possível abrir o aplicativo");
    });
  }

  function visibleFocusables() {
    var selector;
    if (settingsOpen) selector = ".settings-focus";
    else if (allAppsOpen) selector = ".all-apps-focus";
    else if (drawerOpen) selector = "#favoritesRail .focusable, #quickDrawer .focusable";
    else selector = ".topbar .focusable, #showcase .focusable, #favoritesRail .focusable";
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (element) {
      return !element.disabled;
    });
  }

  function setVisualFocus(element) {
    if (visualFocusedElement && visualFocusedElement !== element) visualFocusedElement.classList.remove("is-focused");
    visualFocusedElement = element || null;
    if (visualFocusedElement) visualFocusedElement.classList.add("is-focused");
  }

  function focusElement(element) {
    if (!element) return;
    setVisualFocus(element);
    try { element.focus({ preventScroll:true }); }
    catch (error) { element.focus(); }
  }

  function libraryGridTarget(direction) {
    var current = document.activeElement;
    if (!allAppsOpen || !current || !current.hasAttribute("data-library-app-id")) return null;
    var items = Array.prototype.slice.call(allAppsGrid.querySelectorAll(".all-apps-focus"));
    var index = items.indexOf(current);
    if (index < 0) return null;
    var columns = 6;
    if (direction === "left" && index % columns > 0) return items[index - 1];
    if (direction === "right" && index % columns < columns - 1 && items[index + 1]) return items[index + 1];
    if (direction === "up") return items[index - columns] || null;
    if (direction === "down" && items[index + columns]) return items[index + columns];
    return current;
  }

  function spatialTarget(direction) {
    var items = visibleFocusables();
    var current = document.activeElement;
    if (items.indexOf(current) < 0) return items[0];
    var source = current.getBoundingClientRect();
    var sx = source.left + source.width / 2;
    var sy = source.top + source.height / 2;
    var best = current;
    var scoreBest = Infinity;
    items.forEach(function (item) {
      if (item === current) return;
      var rect = item.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var primary;
      var secondary;
      var aligned;
      if (direction === "left" && x < sx - 3) { primary = sx - x; secondary = Math.abs(y - sy); aligned = rect.bottom >= source.top && rect.top <= source.bottom; }
      else if (direction === "right" && x > sx + 3) { primary = x - sx; secondary = Math.abs(y - sy); aligned = rect.bottom >= source.top && rect.top <= source.bottom; }
      else if (direction === "up" && y < sy - 3) { primary = sy - y; secondary = Math.abs(x - sx); aligned = rect.right >= source.left && rect.left <= source.right; }
      else if (direction === "down" && y > sy + 3) { primary = y - sy; secondary = Math.abs(x - sx); aligned = rect.right >= source.left && rect.left <= source.right; }
      else return;
      var score = primary * 10 + secondary + (aligned ? 0 : 100000);
      if (score < scoreBest) { scoreBest = score; best = item; }
    });
    return best;
  }

  function reorderFavorite(direction) {
    var current = document.activeElement;
    if (!current || !current.hasAttribute("data-app-id") || (direction !== "left" && direction !== "right")) return false;
    var id = current.getAttribute("data-app-id");
    var ids = apps.map(function (app) { return app.id; });
    var from = ids.indexOf(id);
    var to = from + (direction === "left" ? -1 : 1);
    if (to < 0 || to >= apps.length) return true;
    var moving = apps[from];
    apps.splice(from, 1);
    apps.splice(to, 0, moving);
    updateSavedOrder();
    renderApps(id);
    showToast("Ordem atualizada");
    return true;
  }

  function pinLibraryApp() {
    var current = document.activeElement;
    var id = current && current.getAttribute("data-library-app-id");
    if (!id) return false;
    var app = allApps.filter(function (item) { return item.id === id; })[0];
    if (!app) return false;
    if (apps.some(function (item) { return item.id === id; })) {
      showToast(app.title + " já está no dock");
      return true;
    }
    if (apps.length >= 8) apps.pop();
    apps.push(app);
    updateSavedOrder();
    renderApps();
    renderAllApps(id);
    showToast(app.title + " foi fixado no dock");
    return true;
  }

  function toggleEditMode(force) {
    if (!apps.length) return;
    var current = document.activeElement;
    var currentId = current && current.getAttribute("data-app-id");
    editMode = typeof force === "boolean" ? force : !editMode;
    renderApps(currentId || apps[0].id);
    document.getElementById("appsTitle").textContent = editMode ? "Organizar aplicativos" : "Seus aplicativos";
    if (!editMode) flushSave();
    showToast(editMode ? "Use ◀ e ▶ para ordenar; pressione OK para concluir" : "Ordem salva");
  }

  function openDrawer() {
    if (drawerOpen || settingsOpen) return;
    drawerOpen = true;
    lastDockFocus = document.activeElement && document.activeElement.hasAttribute("data-app-id") ? document.activeElement : rail.querySelector(".app-tile");
    document.body.classList.add("drawer-open");
    quickDrawer.setAttribute("aria-hidden", "false");
    focusElement(quickDrawer.querySelector(".drawer-focus"));
  }

  function closeDrawer(restoreFocus) {
    if (!drawerOpen) return;
    drawerOpen = false;
    document.body.classList.remove("drawer-open");
    quickDrawer.setAttribute("aria-hidden", "true");
    if (restoreFocus !== false) focusElement(lastDockFocus || rail.querySelector(".app-tile"));
  }

  function openAllApps() {
    if (allAppsOpen || settingsOpen) return;
    clearTimeout(allAppsCleanupTimer);
    var previousFocus = document.activeElement;
    if (drawerOpen) closeDrawer(false);
    allAppsOpen = true;
    lastMainFocus = lastDockFocus || previousFocus;
    if (allAppsDirty || !allAppsGrid.firstChild) renderAllApps();
    document.body.classList.add("all-apps-open");
    allAppsPanel.setAttribute("aria-hidden", "false");
    focusElement(allAppsGrid.querySelector(".all-apps-focus") || document.getElementById("closeAllApps"));
  }

  function closeAllApps() {
    if (!allAppsOpen) return;
    allAppsOpen = false;
    document.body.classList.remove("all-apps-open");
    allAppsPanel.setAttribute("aria-hidden", "true");
    focusElement(lastMainFocus || rail.querySelector(".app-tile"));
    allAppsCleanupTimer = setTimeout(function () {
      if (!allAppsOpen) {
        allAppsGrid.textContent = "";
        allAppsDirty = true;
      }
    }, 220);
  }

  function openSettings() {
    if (settingsOpen) return;
    settingsOpen = true;
    lastMainFocus = document.activeElement;
    document.body.classList.add("settings-open");
    settingsPanel.setAttribute("aria-hidden", "false");
    scrim.setAttribute("aria-hidden", "false");
    focusElement(document.getElementById("closeSettings"));
  }

  function closeSettings() {
    if (!settingsOpen) return;
    settingsOpen = false;
    document.body.classList.remove("settings-open");
    settingsPanel.setAttribute("aria-hidden", "true");
    scrim.setAttribute("aria-hidden", "true");
    flushSave();
    focusElement(lastMainFocus || document.getElementById("settingsButton"));
  }

  function setWallpaper(name, announce, persist) {
    if (WALLPAPERS.indexOf(name) < 0) return;
    document.body.setAttribute("data-wallpaper", name);
    document.getElementById("wallpaperName").textContent = WALLPAPER_NAMES[name];
    Array.prototype.forEach.call(document.querySelectorAll("[data-wallpaper-option]"), function (button) {
      button.classList.toggle("is-selected", button.getAttribute("data-wallpaper-option") === name);
    });
    if (persist !== false) { state.appearance.wallpaper = name; queueSave(); }
    if (announce) showToast("Papel de parede: " + WALLPAPER_NAMES[name]);
  }

  function cycleWallpaper() {
    var current = document.body.getAttribute("data-wallpaper") || WALLPAPERS[0];
    setWallpaper(WALLPAPERS[(WALLPAPERS.indexOf(current) + 1) % WALLPAPERS.length], true, true);
  }

  function setQuality(name, persist) {
    if (!QUALITY_NAMES[name]) return;
    document.body.setAttribute("data-quality", name);
    document.getElementById("qualityName").textContent = QUALITY_NAMES[name];
    Array.prototype.forEach.call(document.querySelectorAll("[data-quality-option]"), function (button) {
      button.classList.toggle("is-selected", button.getAttribute("data-quality-option") === name);
    });
    if (persist !== false) { state.appearance.quality = name; queueSave(); }
  }

  function setGlassIntensity(value, persist) {
    var clean = clampStep(value, 40, 90, 2, 72);
    document.getElementById("glassIntensity").value = String(clean);
    document.getElementById("glassValue").textContent = clean + "%";
    document.documentElement.style.setProperty("--glass-alpha", String(.12 + clean / 200));
    if (persist !== false) { state.appearance.glassIntensity = clean; queueSave(); }
  }

  function setBlur(value, persist) {
    var clean = clampStep(value, 0, 12, 2, 8);
    document.getElementById("blurIntensity").value = String(clean);
    document.getElementById("blurValue").textContent = String(clean);
    document.documentElement.style.setProperty("--glass-blur", clean + "px");
    if (persist !== false) { state.appearance.blur = clean; queueSave(); }
  }

  function setMotion(enabled, announce, persist) {
    var button = document.getElementById("motionToggle");
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-checked", enabled ? "true" : "false");
    document.body.classList.toggle("reduce-motion", !enabled);
    if (persist !== false) { state.appearance.motion = enabled; queueSave(); }
    if (announce) showToast(enabled ? "Movimento suave ativado" : "Movimento reduzido");
  }

  function applyState() {
    setWallpaper(state.appearance.wallpaper, false, false);
    setQuality(state.appearance.quality, false);
    setGlassIntensity(state.appearance.glassIntensity, false);
    setBlur(state.appearance.blur, false);
    setMotion(state.appearance.motion, false, false);
  }

  function adjustRange(input, delta) {
    var next = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + delta * Number(input.step || 1)));
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles:true }));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function updateDateTime() {
    var now = new Date();
    var time = now.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
    document.getElementById("clock").textContent = time;
    document.getElementById("drawerClock").textContent = time;
    document.getElementById("drawerDate").textContent = now.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" });
  }

  function resetCatalogFallback() {
    storyCards.forEach(function (card, index) {
      var saved = fallbackStories[index];
      var image = document.getElementById("catalogImage" + index);
      var badge = document.getElementById("storyBadge" + index);
      card._catalogItem = null;
      card.classList.remove("has-catalog-image");
      card.setAttribute("data-story", saved.story);
      document.getElementById("storyTitle" + index).textContent = saved.title;
      document.getElementById("storyMeta" + index).textContent = saved.meta;
      image.classList.remove("is-visible");
      image.hidden = true;
      image.removeAttribute("src");
      if (badge) { badge.textContent = saved.badge; badge.hidden = saved.badgeHidden; }
    });
  }

  function catalogMeta(item) {
    var pieces = [item.mediaType === "tv" ? "Série" : "Filme"];
    if (item.year) pieces.push(item.year);
    if (item.rating) pieces.push("★ " + item.rating.toFixed(1));
    return pieces.join(" · ");
  }

  function renderCatalog(items) {
    if (!items || items.length < 3) return false;
    storyCards.forEach(function (card, index) {
      var item = items[index];
      var image = document.getElementById("catalogImage" + index);
      var badge = document.getElementById("storyBadge" + index);
      var url = catalog.imageUrl(item, index === 0, state.appearance.quality);
      card._catalogItem = item;
      card.setAttribute("data-story", item.title);
      document.getElementById("storyTitle" + index).textContent = item.title;
      document.getElementById("storyMeta" + index).textContent = catalogMeta(item);
      if (badge) {
        badge.hidden = false;
        badge.textContent = index === 0 ? "EM ALTA" : item.mediaType === "tv" ? "SÉRIE" : "FILME";
      }
      image.classList.remove("is-visible");
      card.classList.remove("has-catalog-image");
      image.hidden = false;
      image.decoding = "async";
      image._requestedUrl = url;
      image.onload = function () {
        if (image._requestedUrl !== url) return;
        image.classList.add("is-visible");
        card.classList.add("has-catalog-image");
      };
      image.onerror = function () {
        if (image._requestedUrl !== url) return;
        image.classList.remove("is-visible");
        card.classList.remove("has-catalog-image");
        image.hidden = true;
        image.removeAttribute("src");
      };
      image.src = url;
    });
    return true;
  }

  function setCatalogStatus(text) {
    catalogStatus.textContent = text;
  }

  function loadCatalog(mode, announce) {
    currentCatalogMode = mode || "discover";
    var requestId = ++catalogRequestId;
    showcase.classList.add("is-loading");
    return catalog.load(currentCatalogMode).then(function (result) {
      if (requestId !== catalogRequestId) return;
      if (result.items && result.items.length >= 3) {
        renderCatalog(result.items);
        setCatalogStatus(result.stale ? "Cache offline" : "Configurada");
        if (announce) showToast(result.stale ? "Exibindo destaques salvos" : "Destaques atualizados pela TMDB");
      } else {
        resetCatalogFallback();
        setCatalogStatus("Não configurada");
        if (announce) showToast("Adicione sua chave TMDB em Aparência");
      }
    }).catch(function (error) {
      if (requestId !== catalogRequestId) return;
      resetCatalogFallback();
      setCatalogStatus(error.code === "AUTH" ? "Chave recusada" : "Sem conexão");
      if (announce) showToast(error.message || "Não foi possível carregar os destaques");
    }).then(function () {
      if (requestId === catalogRequestId) showcase.classList.remove("is-loading");
    });
  }

  function updateCredentialUI() {
    var configured = catalog.hasCredential();
    credentialInput.value = "";
    credentialInput.placeholder = configured ? "Chave salva nesta TV" : "API Key ou Read Access Token";
    setCatalogStatus(configured ? "Configurada" : "Não configurada");
  }

  function saveCredential() {
    var value = credentialInput.value.trim();
    if (!value) { showToast(catalog.hasCredential() ? "Uma chave já está salva nesta TV" : "Digite sua chave da TMDB"); return; }
    var button = document.getElementById("saveTmdbCredential");
    button.disabled = true;
    setCatalogStatus("Verificando");
    catalog.validateCredential(value).then(function () {
      if (!catalog.saveCredential(value)) throw new Error("A TV não permitiu salvar a chave");
      credentialInput.value = "";
      credentialInput.placeholder = "Chave salva nesta TV";
      setCatalogStatus("Configurada");
      showToast("TMDB configurada com sucesso");
      return loadCatalog(currentCatalogMode, false);
    }).catch(function (error) {
      setCatalogStatus(error.code === "AUTH" || error.code === "FORMAT" ? "Chave recusada" : "Sem conexão");
      showToast(error.message || "Não foi possível validar a chave");
    }).then(function () { button.disabled = false; });
  }

  function removeCredential() {
    catalog.removeCredential();
    updateCredentialUI();
    resetCatalogFallback();
    showToast("Chave da TMDB removida desta TV");
  }

  document.getElementById("settingsButton").addEventListener("click", openSettings);
  document.getElementById("drawerSettings").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  document.getElementById("wallpaperButton").addEventListener("click", cycleWallpaper);
  document.getElementById("signalButton").addEventListener("click", function () { showToast(platformDetail); });
  document.getElementById("saveTmdbCredential").addEventListener("click", saveCredential);
  document.getElementById("clearTmdbCredential").addEventListener("click", removeCredential);
  document.getElementById("closeAllApps").addEventListener("click", closeAllApps);
  scrim.addEventListener("click", closeSettings);

  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (button) {
    button.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (item) { item.classList.remove("is-active"); });
      button.classList.add("is-active");
      loadCatalog(button.getAttribute("data-catalog-mode") || "discover", true);
    });
  });

  storyCards.forEach(function (button) {
    button.addEventListener("mouseenter", function () { focusElement(button); });
    button.addEventListener("click", function () {
      var item = button._catalogItem;
      if (!item) { showToast("“" + button.getAttribute("data-story") + "” — conteúdo demonstrativo"); return; }
      var message = item.overview || (item.title + " · " + catalogMeta(item));
      showToast(message.length > 190 ? message.slice(0, 187) + "…" : message);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-quick]"), function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-system-app");
      var label = button.getAttribute("data-quick");
      if (id) {
        platform.launchSystemApp(id).catch(function (error) { showToast(error.message || (label + " não está disponível")); });
      } else if (label === "Todos os apps") {
        openAllApps();
      } else {
        showToast(label + " — integração em preparação");
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-wallpaper-option]"), function (button) {
    button.addEventListener("click", function () { setWallpaper(button.getAttribute("data-wallpaper-option"), true, true); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-quality-option]"), function (button) {
    button.addEventListener("click", function () { setQuality(button.getAttribute("data-quality-option"), true); });
  });

  document.getElementById("glassIntensity").addEventListener("input", function (event) { setGlassIntensity(event.target.value, true); });
  document.getElementById("blurIntensity").addEventListener("input", function (event) { setBlur(event.target.value, true); });
  document.getElementById("glassIntensity").addEventListener("change", flushSave);
  document.getElementById("blurIntensity").addEventListener("change", flushSave);
  document.getElementById("motionToggle").addEventListener("click", function () {
    setMotion(!document.getElementById("motionToggle").classList.contains("is-on"), true, true);
  });

  function keepFocusVisible(element, container) {
    if (!element || !container) return;
    var target = element.getBoundingClientRect();
    var viewport = container.getBoundingClientRect();
    if (target.top < viewport.top || target.bottom > viewport.bottom) {
      try { element.scrollIntoView({ block:"nearest", behavior:"auto" }); }
      catch (error) { element.scrollIntoView(false); }
    }
  }

  document.addEventListener("focusin", function (event) {
    if (event.target.classList.contains("focusable")) setVisualFocus(event.target);
    if (settingsOpen && event.target.classList.contains("settings-focus")) {
      keepFocusVisible(event.target, document.querySelector(".settings-scroll"));
    }
    if (allAppsOpen && event.target.classList.contains("all-apps-focus")) {
      keepFocusVisible(event.target, allAppsGrid);
    }
  });

  document.addEventListener("keydown", function (event) {
    var code = event.keyCode;
    var key = event.key || "";
    var direction = code === 37 ? "left" : code === 38 ? "up" : code === 39 ? "right" : code === 40 ? "down" : null;
    var current = document.activeElement;
    var handled = false;

    if (direction) {
      if (editMode && reorderFavorite(direction)) handled = true;
      else if (settingsOpen && current && current.type === "range" && (direction === "left" || direction === "right")) {
        adjustRange(current, direction === "left" ? -1 : 1);
        handled = true;
      } else if (!drawerOpen && !settingsOpen && direction === "down" && current && current.hasAttribute("data-app-id")) {
        openDrawer();
        handled = true;
      } else {
        focusElement(libraryGridTarget(direction) || spatialTarget(direction));
        handled = true;
      }
    } else if (code === 13 && current && current.id === "tmdbCredential") {
      saveCredential();
      handled = true;
    } else if (code === 13 && current && typeof current.click === "function") {
      current.click();
      handled = true;
    } else if (code === COLOR_KEYS.GREEN || key.toLowerCase() === "e") {
      if (allAppsOpen) {
        handled = pinLibraryApp();
      } else if (!settingsOpen) {
        if (drawerOpen) closeDrawer();
        toggleEditMode();
        handled = true;
      }
    } else if (code === COLOR_KEYS.BLUE || key.toLowerCase() === "t") {
      cycleWallpaper();
      handled = true;
    } else if (code === 461 || code === 27 || key === "Escape") {
      if (settingsOpen) closeSettings();
      else if (allAppsOpen) closeAllApps();
      else if (drawerOpen) closeDrawer();
      else if (editMode) toggleEditMode(false);
      else if (platform.isWebOS()) platform.closeApp();
      else showToast("No televisor, Voltar fechará o Mendes Home");
      handled = true;
    }

    if (handled) { event.preventDefault(); event.stopPropagation(); }
  });

  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flushSave(); });

  if (!(window.CSS && CSS.supports && (CSS.supports("backdrop-filter", "blur(2px)") || CSS.supports("-webkit-backdrop-filter", "blur(2px)")))) {
    document.documentElement.classList.add("no-backdrop");
  }

  applyState();
  if (performanceMigrationPending) flushSave();
  apps = platform.demoApps();
  allApps = apps.slice();
  renderApps();
  updateAllAppsSummary();
  updateCredentialUI();
  updateDateTime();
  setInterval(updateDateTime, 60000);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(function () { loadInstalledApps(); }, { timeout:400 });
  } else {
    setTimeout(function () { loadInstalledApps(); }, 80);
  }
  setTimeout(function () { loadCatalog("discover", false); }, tvRuntime ? 240 : 80);
  setTimeout(function () { focusElement(document.querySelector(".story-card")); }, 60);
}());
