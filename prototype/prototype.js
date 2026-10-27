(function () {
  "use strict";

  var WALLPAPERS = ["aurora", "sunset", "lagoon", "graphite"];
  var WALLPAPER_NAMES = { aurora: "Aurora", sunset: "Horizonte", lagoon: "Laguna", graphite: "Grafite" };
  var QUALITY_NAMES = { light: "Leve", balanced: "Equilibrado", full: "Máximo" };
  var COLOR_KEYS = { GREEN: 404, BLUE: 406 };
  var editMode = false;
  var settingsOpen = false;
  var lastMainFocus = null;
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
    { id: "cinema", title: "Cinema", description: "Filmes e séries reunidos em um espaço feito para você.", a: "#2a91a5", b: "#102e56" },
    { id: "music", title: "Música", description: "Suas faixas, álbuns e playlists em uma experiência envolvente.", a: "#9f5fe0", b: "#34205d" },
    { id: "photos", title: "Fotos", description: "Memórias da família apresentadas com cor, luz e profundidade.", a: "#f49c70", b: "#a9446d" },
    { id: "tv", title: "TV ao vivo", description: "Canais e programação disponíveis com acesso direto.", a: "#58d59e", b: "#176a69" },
    { id: "web", title: "Navegador", description: "A internet em uma tela ampla, limpa e confortável.", a: "#5cacf2", b: "#244d9f" },
    { id: "games", title: "Jogos", description: "Entretenimento interativo com seus títulos favoritos.", a: "#f1bd55", b: "#a7552d" },
    { id: "home", title: "Casa", description: "Acompanhe os dispositivos conectados do seu ambiente.", a: "#73d6c8", b: "#286c7d" },
    { id: "files", title: "Arquivos", description: "Vídeos, imagens e mídias organizados em um único lugar.", a: "#9caec4", b: "#4a566e" }
  ];

  var rail = document.getElementById("favoritesRail");
  var settingsPanel = document.getElementById("settingsPanel");
  var scrim = document.getElementById("scrim");
  var toast = document.getElementById("toast");

  function renderApps() {
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
      button.addEventListener("focus", function () { selectApp(app); });
      button.addEventListener("mouseenter", function () { button.focus(); });
      button.addEventListener("click", function () {
        if (editMode) toggleEditMode(false);
        else showToast("Protótipo visual — “" + app.title + "” será integrado na próxima etapa");
      });
      rail.appendChild(button);
    });
  }

  function selectApp(app) {
    document.getElementById("heroTitle").textContent = app.title;
    document.getElementById("heroDescription").textContent = app.description;
    document.getElementById("heroGlyph").innerHTML = icons[app.id];
    document.getElementById("hero").style.setProperty("--accent", app.a);
  }

  function visibleFocusables() {
    var selector = settingsOpen ? ".settings-focus" : "#appShell .focusable";
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (element) {
      var rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !element.disabled;
    });
  }

  function focusElement(element) {
    if (!element) return;
    visibleFocusables().forEach(function (item) { item.classList.remove("is-focused"); });
    element.classList.add("is-focused");
    element.focus();
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
      if (direction === "left" && x < sx - 3) { primary = sx - x; secondary = Math.abs(y - sy); }
      else if (direction === "right" && x > sx + 3) { primary = x - sx; secondary = Math.abs(y - sy); }
      else if (direction === "up" && y < sy - 3) { primary = sy - y; secondary = Math.abs(x - sx); }
      else if (direction === "down" && y > sy + 3) { primary = y - sy; secondary = Math.abs(x - sx); }
      else return;
      var score = primary * 12 + secondary;
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
    apps.splice(from, 1); apps.splice(to, 0, moving);
    renderApps();
    focusElement(rail.querySelector('[data-app-id="' + id + '"]'));
    showToast("Ordem atualizada");
    return true;
  }

  function toggleEditMode(force) {
    editMode = typeof force === "boolean" ? force : !editMode;
    renderApps();
    var hint = document.getElementById("editHint");
    hint.textContent = editMode ? "Modo organizar — use ◀ ▶ e pressione OK para concluir" : "Acesso rápido e personalizável";
    hint.classList.toggle("is-editing", editMode);
    focusElement(rail.querySelector(".app-tile"));
    showToast(editMode ? "Organização ativada" : "Ordem salva");
  }

  function openSettings() {
    if (settingsOpen) return;
    settingsOpen = true;
    lastMainFocus = document.activeElement;
    document.body.classList.add("settings-open");
    settingsPanel.setAttribute("aria-hidden", "false");
    scrim.setAttribute("aria-hidden", "false");
    setTimeout(function () { focusElement(document.getElementById("closeSettings")); }, 60);
  }

  function closeSettings() {
    if (!settingsOpen) return;
    settingsOpen = false;
    document.body.classList.remove("settings-open");
    settingsPanel.setAttribute("aria-hidden", "true");
    scrim.setAttribute("aria-hidden", "true");
    setTimeout(function () { focusElement(lastMainFocus || document.getElementById("settingsButton")); }, 60);
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
    document.getElementById("clock").textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("dateLabel").textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase();
    var hour = now.getHours();
    document.getElementById("greeting").textContent = (hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite") + ", Carlos.";
  }

  document.getElementById("settingsButton").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  scrim.addEventListener("click", closeSettings);

  Array.prototype.forEach.call(document.querySelectorAll("[data-wallpaper-option]"), function (button) {
    button.addEventListener("click", function () { setWallpaper(button.getAttribute("data-wallpaper-option"), true); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-quality-option]"), function (button) {
    button.addEventListener("click", function () { setQuality(button.getAttribute("data-quality-option")); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (button) {
    button.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (item) { item.classList.remove("is-active"); });
      button.classList.add("is-active");
      showToast("Visão “" + button.textContent + "” — demonstração visual");
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-section]"), function (button) {
    button.addEventListener("click", function () { showToast(button.getAttribute("data-section") + " — conteúdo da próxima etapa"); });
  });

  document.getElementById("glassIntensity").addEventListener("input", function (event) {
    var value = Number(event.target.value);
    document.documentElement.style.setProperty("--glass-alpha", String((100 - value) / 100 * .42));
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
    Array.prototype.forEach.call(document.querySelectorAll(".is-focused"), function (item) { if (item !== event.target) item.classList.remove("is-focused"); });
    if (event.target.classList.contains("focusable")) event.target.classList.add("is-focused");
  });

  document.addEventListener("keydown", function (event) {
    var code = event.keyCode;
    var key = event.key || "";
    var direction = code === 37 ? "left" : code === 38 ? "up" : code === 39 ? "right" : code === 40 ? "down" : null;
    var handled = false;
    if (direction) {
      if (editMode && reorderFavorite(direction)) handled = true;
      else if (settingsOpen && document.activeElement && document.activeElement.type === "range" && (direction === "left" || direction === "right")) {
        adjustRange(document.activeElement, direction === "left" ? -1 : 1); handled = true;
      } else { focusElement(spatialTarget(direction)); handled = true; }
    } else if (code === 13 && document.activeElement && typeof document.activeElement.click === "function") {
      document.activeElement.click(); handled = true;
    } else if (code === COLOR_KEYS.GREEN || key.toLowerCase() === "e") {
      if (!settingsOpen) toggleEditMode(); handled = true;
    } else if (code === COLOR_KEYS.BLUE || key.toLowerCase() === "t") {
      cycleWallpaper(); handled = true;
    } else if (code === 461 || code === 27 || key === "Escape") {
      if (settingsOpen) closeSettings();
      else if (editMode) toggleEditMode(false);
      else showToast("No televisor, Voltar fechará o launcher");
      handled = true;
    }
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  });

  if (!(window.CSS && CSS.supports && (CSS.supports("backdrop-filter", "blur(2px)") || CSS.supports("-webkit-backdrop-filter", "blur(2px)")))) {
    document.documentElement.classList.add("no-backdrop");
  }

  renderApps(); selectApp(apps[0]); setQuality("balanced"); updateDateTime();
  setInterval(updateDateTime, 30000);
  setTimeout(function () { focusElement(rail.querySelector(".app-tile")); }, 80);
}());
