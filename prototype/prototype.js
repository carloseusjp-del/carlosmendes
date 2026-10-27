(function () {
  "use strict";

  var WALLPAPERS = ["wall", "mist", "sand", "night"];
  var WALLPAPER_NAMES = { wall: "Parede iluminada", mist: "Névoa", sand: "Areia", night: "Noite" };
  var QUALITY_NAMES = { light: "Leve", balanced: "Equilibrado", full: "Máximo" };
  var COLOR_KEYS = { GREEN: 404, BLUE: 406 };
  var editMode = false;
  var drawerOpen = false;
  var settingsOpen = false;
  var lastMainFocus = null;
  var lastDockFocus = null;
  var toastTimer = null;

  var icons = {
    cinema: '<svg viewBox="0 0 48 48"><path d="M15 11v26M33 11v26M10 16h28M10 32h28M10 11h28v26H10zM15 11l4 5m5-5 4 5m5-5 4 5"/></svg>',
    music: '<svg viewBox="0 0 48 48"><path d="M18 33V15l20-4v18M18 20l20-4"/><ellipse cx="13" cy="35" rx="5" ry="4"/><ellipse cx="33" cy="31" rx="5" ry="4"/></svg>',
    photos: '<svg viewBox="0 0 48 48"><rect x="9" y="10" width="30" height="28" rx="6"/><circle cx="29" cy="19" r="4"/><path d="m12 34 9-10 6 6 4-4 6 8"/></svg>',
    tv: '<svg viewBox="0 0 48 48"><rect x="7" y="12" width="34" height="25" rx="6"/><path d="m18 7 6 5 6-5M18 41h12m3-21 9 5-9 5z"/></svg>',
    web: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8c5 5 7 10 7 16s-2 11-7 16c-5-5-7-10-7-16s2-11 7-16z"/></svg>',
    games: '<svg viewBox="0 0 48 48"><path d="M15 18h18c5 0 9 5 9 11 0 5-3 9-7 9-3 0-5-4-7-6h-8c-2 2-4 6-7 6-4 0-7-4-7-9 0-6 4-11 9-11zM14 27h8M18 23v8M32 25h.1M36 29h.1"/></svg>',
    home: '<svg viewBox="0 0 48 48"><path d="M9 23 24 10l15 13v15H28V27h-8v11H9zM34 14v-3h5v8"/></svg>',
    files: '<svg viewBox="0 0 48 48"><path d="M7 16h14l4 5h16v17H7zM7 16v-5h13l4 5"/></svg>'
  };

  var apps = [
    { id: "cinema", title: "Cinema", a: "#214e5d", b: "#102f44" },
    { id: "music", title: "Música", a: "#8c67c8", b: "#4b2e74" },
    { id: "photos", title: "Fotos", a: "#e58c74", b: "#b64f68" },
    { id: "tv", title: "TV ao vivo", a: "#4cbd91", b: "#237b73" },
    { id: "web", title: "Navegador", a: "#4f9ee2", b: "#2b5eae" },
    { id: "games", title: "Jogos", a: "#dfa74e", b: "#a65a31" },
    { id: "home", title: "Casa", a: "#57bfb5", b: "#2f7582" },
    { id: "files", title: "Arquivos", a: "#8a9bad", b: "#526173" }
  ];

  var rail = document.getElementById("favoritesRail");
  var settingsPanel = document.getElementById("settingsPanel");
  var quickDrawer = document.getElementById("quickDrawer");
  var scrim = document.getElementById("scrim");
  var toast = document.getElementById("toast");

  function renderApps(focusId) {
    rail.textContent = "";
    apps.forEach(function (app) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "app-tile focusable" + (editMode ? " is-editing" : "");
      button.setAttribute("data-app-id", app.id);
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", app.title);
      button.style.setProperty("--app-a", app.a);
      button.style.setProperty("--app-b", app.b);
      button.innerHTML = '<span class="app-icon">' + icons[app.id] + '</span><span class="app-name">' + app.title + "</span>";
      button.addEventListener("mouseenter", function () { focusElement(button); });
      button.addEventListener("click", function () {
        if (editMode) toggleEditMode(false);
        else showToast("Protótipo visual — “" + app.title + "” será integrado depois da aprovação");
      });
      rail.appendChild(button);
    });
    if (focusId) focusElement(rail.querySelector('[data-app-id="' + focusId + '"]'));
  }

  function visibleFocusables() {
    var selector;
    if (settingsOpen) selector = ".settings-focus";
    else if (drawerOpen) selector = "#favoritesRail .focusable, #quickDrawer .focusable";
    else selector = ".topbar .focusable, #showcase .focusable, #favoritesRail .focusable";
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (element) {
      var rect = element.getBoundingClientRect();
      var style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && !element.disabled;
    });
  }

  function focusElement(element) {
    if (!element) return;
    Array.prototype.forEach.call(document.querySelectorAll(".is-focused"), function (item) { item.classList.remove("is-focused"); });
    element.classList.add("is-focused");
    try { element.focus({ preventScroll: true }); }
    catch (error) { element.focus(); }
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
    renderApps(id);
    showToast("Ordem atualizada");
    return true;
  }

  function toggleEditMode(force) {
    var current = document.activeElement;
    var currentId = current && current.getAttribute("data-app-id");
    editMode = typeof force === "boolean" ? force : !editMode;
    renderApps(currentId || apps[0].id);
    document.getElementById("appsTitle").textContent = editMode ? "Organizar aplicativos" : "Seus aplicativos";
    showToast(editMode ? "Use ◀ e ▶ para ordenar; pressione OK para concluir" : "Ordem salva no protótipo");
  }

  function openDrawer() {
    if (drawerOpen || settingsOpen) return;
    drawerOpen = true;
    lastDockFocus = document.activeElement && document.activeElement.hasAttribute("data-app-id") ? document.activeElement : rail.querySelector(".app-tile");
    document.body.classList.add("drawer-open");
    quickDrawer.setAttribute("aria-hidden", "false");
    setTimeout(function () { focusElement(quickDrawer.querySelector(".drawer-focus")); }, 300);
  }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    document.body.classList.remove("drawer-open");
    quickDrawer.setAttribute("aria-hidden", "true");
    setTimeout(function () { focusElement(lastDockFocus || rail.querySelector(".app-tile")); }, 220);
  }

  function openSettings() {
    if (settingsOpen) return;
    settingsOpen = true;
    lastMainFocus = document.activeElement;
    document.body.classList.add("settings-open");
    settingsPanel.setAttribute("aria-hidden", "false");
    scrim.setAttribute("aria-hidden", "false");
    setTimeout(function () { focusElement(document.getElementById("closeSettings")); }, 70);
  }

  function closeSettings() {
    if (!settingsOpen) return;
    settingsOpen = false;
    document.body.classList.remove("settings-open");
    settingsPanel.setAttribute("aria-hidden", "true");
    scrim.setAttribute("aria-hidden", "true");
    setTimeout(function () { focusElement(lastMainFocus || document.getElementById("settingsButton")); }, 70);
  }

  function setWallpaper(name, announce) {
    if (WALLPAPERS.indexOf(name) < 0) return;
    document.body.setAttribute("data-wallpaper", name);
    document.getElementById("wallpaperName").textContent = WALLPAPER_NAMES[name];
    Array.prototype.forEach.call(document.querySelectorAll("[data-wallpaper-option]"), function (button) {
      button.classList.toggle("is-selected", button.getAttribute("data-wallpaper-option") === name);
    });
    if (announce) showToast("Papel de parede: " + WALLPAPER_NAMES[name]);
  }

  function cycleWallpaper() {
    var current = document.body.getAttribute("data-wallpaper") || WALLPAPERS[0];
    setWallpaper(WALLPAPERS[(WALLPAPERS.indexOf(current) + 1) % WALLPAPERS.length], true);
  }

  function setQuality(name) {
    if (!QUALITY_NAMES[name]) return;
    document.body.setAttribute("data-quality", name);
    document.getElementById("qualityName").textContent = QUALITY_NAMES[name];
    Array.prototype.forEach.call(document.querySelectorAll("[data-quality-option]"), function (button) {
      button.classList.toggle("is-selected", button.getAttribute("data-quality-option") === name);
    });
  }

  function adjustRange(input, delta) {
    var next = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + delta * Number(input.step || 1)));
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2300);
  }

  function updateDateTime() {
    var now = new Date();
    var time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("clock").textContent = time;
    document.getElementById("drawerClock").textContent = time;
    document.getElementById("drawerDate").textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }

  document.getElementById("settingsButton").addEventListener("click", openSettings);
  document.getElementById("drawerSettings").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  document.getElementById("wallpaperButton").addEventListener("click", cycleWallpaper);
  document.getElementById("signalButton").addEventListener("click", function () { showToast("Conexão local pronta para a futura integração com a TV"); });
  scrim.addEventListener("click", closeSettings);

  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (button) {
    button.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (item) { item.classList.remove("is-active"); });
      button.classList.add("is-active");
      showToast(button.textContent + " — variação visual do protótipo");
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-story]"), function (button) {
    button.addEventListener("mouseenter", function () { focusElement(button); });
    button.addEventListener("click", function () { showToast("“" + button.getAttribute("data-story") + "” — conteúdo demonstrativo"); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-quick]"), function (button) {
    button.addEventListener("click", function () { showToast(button.getAttribute("data-quick") + " — integração prevista para a próxima etapa"); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-wallpaper-option]"), function (button) {
    button.addEventListener("click", function () { setWallpaper(button.getAttribute("data-wallpaper-option"), true); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-quality-option]"), function (button) {
    button.addEventListener("click", function () { setQuality(button.getAttribute("data-quality-option")); });
  });

  document.getElementById("glassIntensity").addEventListener("input", function (event) {
    var value = Number(event.target.value);
    document.documentElement.style.setProperty("--glass-alpha", String(.12 + value / 200));
    document.getElementById("glassValue").textContent = value + "%";
  });

  document.getElementById("blurIntensity").addEventListener("input", function (event) {
    document.documentElement.style.setProperty("--glass-blur", event.target.value + "px");
    document.getElementById("blurValue").textContent = event.target.value;
  });

  document.getElementById("motionToggle").addEventListener("click", function (event) {
    var enabled = !event.currentTarget.classList.contains("is-on");
    event.currentTarget.classList.toggle("is-on", enabled);
    event.currentTarget.setAttribute("aria-checked", enabled ? "true" : "false");
    document.body.classList.toggle("reduce-motion", !enabled);
    showToast(enabled ? "Movimento suave ativado" : "Movimento reduzido");
  });

  document.addEventListener("focusin", function (event) {
    Array.prototype.forEach.call(document.querySelectorAll(".is-focused"), function (item) {
      if (item !== event.target) item.classList.remove("is-focused");
    });
    if (event.target.classList.contains("focusable")) event.target.classList.add("is-focused");
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
        focusElement(spatialTarget(direction));
        handled = true;
      }
    } else if (code === 13 && current && typeof current.click === "function") {
      current.click();
      handled = true;
    } else if (code === COLOR_KEYS.GREEN || key.toLowerCase() === "e") {
      if (!settingsOpen) {
        if (drawerOpen) closeDrawer();
        setTimeout(function () { toggleEditMode(); }, drawerOpen ? 240 : 0);
        handled = true;
      }
    } else if (code === COLOR_KEYS.BLUE || key.toLowerCase() === "t") {
      cycleWallpaper();
      handled = true;
    } else if (code === 461 || code === 27 || key === "Escape") {
      if (settingsOpen) closeSettings();
      else if (drawerOpen) closeDrawer();
      else if (editMode) toggleEditMode(false);
      else showToast("No televisor, Voltar fechará o Mendes Home");
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  if (!(window.CSS && CSS.supports && (CSS.supports("backdrop-filter", "blur(2px)") || CSS.supports("-webkit-backdrop-filter", "blur(2px)")))) {
    document.documentElement.classList.add("no-backdrop");
  }

  renderApps();
  setQuality("balanced");
  updateDateTime();
  setInterval(updateDateTime, 30000);
  setTimeout(function () { focusElement(document.querySelector(".story-card")); }, 90);
}());
