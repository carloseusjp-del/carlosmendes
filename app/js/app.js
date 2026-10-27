(function () {
  "use strict";

  var APP_ID = "com.carlosmendes.mendeshome";
  var STORAGE_ORDER = "mendes-home.app-order.v1";
  var STORAGE_THEME = "mendes-home.theme.v1";
  var THEMES = ["aurora", "sunset", "graphite"];
  var COLOR_KEYS = { GREEN: 404, BLUE: 406 };
  var apps = [];
  var focusedIndex = 0;
  var editMode = false;
  var bridges = [];
  var toastTimer = null;

  var grid = document.getElementById("appGrid");
  var emptyState = document.getElementById("emptyState");
  var emptyMessage = document.getElementById("emptyMessage");
  var connectionState = document.getElementById("connectionState");
  var appCount = document.getElementById("appCount");
  var toast = document.getElementById("toast");

  function callLuna(method, parameters) {
    return new Promise(function (resolve, reject) {
      if (typeof window.PalmServiceBridge !== "function") {
        reject(new Error("PalmServiceBridge indisponível fora da TV"));
        return;
      }

      var bridge = new window.PalmServiceBridge();
      bridges.push(bridge);
      bridge.onservicecallback = function (raw) {
        var index = bridges.indexOf(bridge);
        if (index >= 0) bridges.splice(index, 1);
        try {
          var response = JSON.parse(raw || "{}");
          if (response.returnValue === false) {
            reject(new Error(response.errorText || "A chamada foi recusada pelo webOS"));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      };
      bridge.call(
        "luna://com.webos.applicationManager/" + method,
        JSON.stringify(parameters || {})
      );
    });
  }

  function normalizeApp(item) {
    var title = item.title || item.defaultAppName || item.id || "Aplicativo";
    return {
      id: item.id || item.appId,
      title: title,
      visible: item.visible !== false && item.noDisplay !== true,
      params: item.params || {},
      accent: accentFor(item.id || title)
    };
  }

  function accentFor(value) {
    var palette = ["#63e6be", "#58b9ff", "#a78bfa", "#ff9f6e", "#f2d15f", "#ef83b9"];
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  }

  function initials(title) {
    var words = title.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "AP";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function storedOrder() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_ORDER) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function applyStoredOrder(items) {
    var order = storedOrder();
    var positions = {};
    order.forEach(function (id, index) { positions[id] = index; });
    return items.slice().sort(function (a, b) {
      var aKnown = Object.prototype.hasOwnProperty.call(positions, a.id);
      var bKnown = Object.prototype.hasOwnProperty.call(positions, b.id);
      if (aKnown && bKnown) return positions[a.id] - positions[b.id];
      if (aKnown) return -1;
      if (bKnown) return 1;
      return a.title.localeCompare(b.title, "pt-BR");
    });
  }

  function saveOrder() {
    localStorage.setItem(STORAGE_ORDER, JSON.stringify(apps.map(function (app) { return app.id; })));
  }

  function render() {
    grid.textContent = "";
    emptyState.hidden = apps.length > 0;
    appCount.textContent = apps.length ? apps.length + (apps.length === 1 ? " aplicativo" : " aplicativos") : "";

    apps.forEach(function (app, index) {
      var button = document.createElement("button");
      button.className = "app-card" + (editMode && index === focusedIndex ? " is-moving" : "");
      button.type = "button";
      button.setAttribute("role", "listitem");
      button.setAttribute("data-index", String(index));
      button.setAttribute("aria-label", "Abrir " + app.title);
      button.style.setProperty("--card-accent", app.accent);

      var glyph = document.createElement("span");
      glyph.className = "app-glyph";
      glyph.textContent = initials(app.title);

      var title = document.createElement("span");
      title.className = "app-title";
      title.textContent = app.title;

      button.appendChild(glyph);
      button.appendChild(title);
      button.addEventListener("focus", function () {
        focusedIndex = index;
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      button.addEventListener("click", function () { launchApp(index); });
      grid.appendChild(button);
    });

    focusCard(focusedIndex, false);
  }

  function focusCard(index, smooth) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".app-card"));
    if (!cards.length) return;
    focusedIndex = Math.max(0, Math.min(index, cards.length - 1));
    cards.forEach(function (card) { card.classList.remove("is-focused"); });
    var card = cards[focusedIndex];
    card.classList.add("is-focused");
    card.focus();
    card.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest", inline: "nearest" });
  }

  function nextSpatialIndex(direction) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".app-card"));
    if (!cards.length) return focusedIndex;
    var source = cards[focusedIndex].getBoundingClientRect();
    var sx = source.left + source.width / 2;
    var sy = source.top + source.height / 2;
    var best = focusedIndex;
    var bestScore = Infinity;

    cards.forEach(function (card, index) {
      if (index === focusedIndex) return;
      var rect = card.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var primary;
      var secondary;

      if (direction === "left" && x < sx) { primary = sx - x; secondary = Math.abs(y - sy); }
      else if (direction === "right" && x > sx) { primary = x - sx; secondary = Math.abs(y - sy); }
      else if (direction === "up" && y < sy) { primary = sy - y; secondary = Math.abs(x - sx); }
      else if (direction === "down" && y > sy) { primary = y - sy; secondary = Math.abs(x - sx); }
      else return;

      var score = primary * 10 + secondary;
      if (score < bestScore) { bestScore = score; best = index; }
    });
    return best;
  }

  function moveOrFocus(direction) {
    var target = nextSpatialIndex(direction);
    if (target === focusedIndex) return;
    if (editMode) {
      var selected = apps[focusedIndex];
      apps[focusedIndex] = apps[target];
      apps[target] = selected;
      focusedIndex = target;
      saveOrder();
      render();
    } else {
      focusCard(target, true);
    }
  }

  function launchApp(index) {
    var app = apps[index];
    if (!app) return;
    if (editMode) {
      editMode = false;
      render();
      showToast("Ordem salva");
      return;
    }
    connectionState.textContent = "Abrindo " + app.title;
    callLuna("launch", { id: app.id, params: app.params }).catch(function (error) {
      connectionState.textContent = "Não foi possível abrir";
      showToast(error.message || "Aplicativo indisponível");
    });
  }

  function toggleEditMode() {
    if (!apps.length) return;
    editMode = !editMode;
    render();
    showToast(editMode ? "Organização ligada — use as setas" : "Ordem salva");
  }

  function cycleTheme() {
    var current = document.body.getAttribute("data-theme") || THEMES[0];
    var next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    document.body.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_THEME, next);
    showToast("Visual: " + next);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function updateClock() {
    var now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    var hour = now.getHours();
    document.querySelector(".intro h1").textContent = (hour < 12 ? "Bom dia." : hour < 18 ? "Boa tarde." : "Boa noite.");
  }

  function extractApps(response) {
    if (Array.isArray(response.apps)) return response.apps;
    if (Array.isArray(response.launchPoints)) return response.launchPoints;
    return [];
  }

  function queryApps() {
    return callLuna("listApps", {}).then(function (response) {
      var result = extractApps(response);
      if (result.length) return result;
      return callLuna("getLaunchPoints", {}).then(extractApps);
    }).catch(function () {
      return callLuna("getLaunchPoints", {}).then(extractApps);
    });
  }

  function loadApps() {
    connectionState.textContent = "Lendo aplicativos";
    queryApps().then(function (received) {
      apps = applyStoredOrder(received.map(normalizeApp).filter(function (app) {
        return app.id && app.id !== APP_ID && app.visible;
      }));
      connectionState.textContent = apps.length ? "Sistema conectado" : "Nenhum aplicativo exposto";
      if (!apps.length) emptyMessage.textContent = "O webOS não retornou aplicativos visíveis para esta conta.";
      render();
    }).catch(function (error) {
      apps = [];
      connectionState.textContent = "Acesso limitado pelo sistema";
      emptyMessage.textContent = error.message || "O Application Manager recusou a consulta.";
      render();
    });
  }

  document.addEventListener("keydown", function (event) {
    var handled = true;
    if (event.keyCode === 37) moveOrFocus("left");
    else if (event.keyCode === 38) moveOrFocus("up");
    else if (event.keyCode === 39) moveOrFocus("right");
    else if (event.keyCode === 40) moveOrFocus("down");
    else if (event.keyCode === 13) launchApp(focusedIndex);
    else if (event.keyCode === COLOR_KEYS.GREEN) toggleEditMode();
    else if (event.keyCode === COLOR_KEYS.BLUE) cycleTheme();
    else if (event.keyCode === 461 || event.keyCode === 27) {
      if (editMode) toggleEditMode();
      else window.close();
    } else handled = false;

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  document.body.setAttribute("data-theme", localStorage.getItem(STORAGE_THEME) || THEMES[0]);
  updateClock();
  setInterval(updateClock, 30000);
  loadApps();
}());
