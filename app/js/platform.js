(function (global) {
  "use strict";

  var APP_ID = "com.carlosmendes.mendeshome";
  var APP_MANAGER = "luna://com.webos.applicationManager/";
  var activeBridges = [];
  var PALETTE = [
    ["#214e5d", "#102f44"], ["#8c67c8", "#4b2e74"],
    ["#e58c74", "#b64f68"], ["#4cbd91", "#237b73"],
    ["#4f9ee2", "#2b5eae"], ["#dfa74e", "#a65a31"],
    ["#57bfb5", "#2f7582"], ["#8a9bad", "#526173"]
  ];

  var DEMO_APPS = [
    { id:"demo.cinema", title:"Cinema", iconKey:"cinema" },
    { id:"demo.music", title:"Música", iconKey:"music" },
    { id:"demo.photos", title:"Fotos", iconKey:"photos" },
    { id:"demo.tv", title:"TV ao vivo", iconKey:"tv" },
    { id:"demo.web", title:"Navegador", iconKey:"web" },
    { id:"demo.games", title:"Jogos", iconKey:"games" },
    { id:"demo.home", title:"Casa", iconKey:"home" },
    { id:"demo.files", title:"Arquivos", iconKey:"files" }
  ];

  var KNOWN_APPS = [
    { id:"netflix", title:"Netflix", iconKey:"cinema" },
    { id:"youtube.leanback.v4", title:"YouTube", iconKey:"tv" },
    { id:"amazon", title:"Prime Video", iconKey:"cinema" },
    { id:"com.disney.disneyplus-prod", title:"Disney+", iconKey:"cinema" },
    { id:"com.wbd.stream", title:"Max", iconKey:"cinema" },
    { id:"com.hbo.hbomax", title:"HBO Max", iconKey:"cinema" },
    { id:"globoplaywebos", title:"Globoplay", iconKey:"tv" },
    { id:"spotify-beehive", title:"Spotify", iconKey:"music" },
    { id:"com.apple.appletv", title:"Apple TV", iconKey:"cinema" },
    { id:"cdp-30", title:"Plex", iconKey:"cinema" },
    { id:"com.crunchyroll.webapp", title:"Crunchyroll", iconKey:"cinema" },
    { id:"com.webos.app.browser", title:"Navegador", iconKey:"web" }
  ];

  function isWebOS() {
    return typeof global.PalmSystem === "object" && typeof global.PalmServiceBridge === "function";
  }

  function currentAppId() {
    return isWebOS() && global.PalmSystem.identifier ? global.PalmSystem.identifier.split(" ")[0] : APP_ID;
  }

  function safeError(message, code) {
    var error = new Error(message || "Operação recusada pelo webOS");
    error.code = code || "WEBOS_ERROR";
    return error;
  }

  function callLuna(method, parameters, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!isWebOS()) {
        reject(safeError("webOS indisponível neste dispositivo", "NOT_WEBOS"));
        return;
      }

      var bridge = new global.PalmServiceBridge();
      var settled = false;
      activeBridges.push(bridge);

      function finish(error, result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        var index = activeBridges.indexOf(bridge);
        if (index >= 0) activeBridges.splice(index, 1);
        if (error) reject(error);
        else resolve(result);
      }

      var timer = setTimeout(function () {
        finish(safeError("O webOS não respondeu a tempo", "TIMEOUT"));
      }, timeoutMs || 4200);

      bridge.onservicecallback = function (raw) {
        try {
          var result = JSON.parse(raw || "{}");
          if (result.returnValue === false) {
            finish(safeError(result.errorText || "Chamada recusada", String(result.errorCode || "DENIED")));
          } else {
            finish(null, result);
          }
        } catch (error) {
          finish(safeError("Resposta inválida do webOS", "INVALID_RESPONSE"));
        }
      };

      try {
        bridge.call(APP_MANAGER + method, JSON.stringify(parameters || {}));
      } catch (error) {
        finish(safeError("Não foi possível acessar o Application Manager", "BRIDGE_ERROR"));
      }
    });
  }

  function hashIndex(value) {
    var hash = 0;
    var text = String(value || "app");
    for (var index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    return Math.abs(hash) % PALETTE.length;
  }

  function inferIconKey(id, title) {
    var value = (String(id || "") + " " + String(title || "")).toLowerCase();
    if (/spotify|music|deezer|audio/.test(value)) return "music";
    if (/photo|gallery|foto/.test(value)) return "photos";
    if (/browser|navegador|web/.test(value)) return "web";
    if (/game|jogo|play/.test(value)) return "games";
    if (/home|casa|iot/.test(value)) return "home";
    if (/file|arquivo|media/.test(value)) return "files";
    if (/live|tv|youtube|globo/.test(value)) return "tv";
    return "cinema";
  }

  function normalizeApp(item, index) {
    var id = item.id || item.appId || item.launchPointId || "";
    var title = item.title || item.defaultAppName || item.appName || id || "Aplicativo";
    var palette = PALETTE[typeof index === "number" ? index % PALETTE.length : hashIndex(id || title)];
    return {
      id:id,
      title:title,
      icon:item.icon || item.largeIcon || item.iconPath || "",
      iconKey:item.iconKey || inferIconKey(id, title),
      params:item.params || {},
      visible:item.visible !== false && item.noDisplay !== true,
      demo:item.demo === true,
      a:item.a || item.bgColor || item.iconColor || palette[0],
      b:item.b || palette[1]
    };
  }

  function uniqueVisible(items) {
    var seen = {};
    return items.map(normalizeApp).filter(function (app) {
      if (!app.id || app.id === currentAppId() || !app.visible || seen[app.id]) return false;
      seen[app.id] = true;
      return true;
    });
  }

  function demoApps() {
    return DEMO_APPS.map(function (app, index) {
      var copy = {};
      Object.keys(app).forEach(function (key) { copy[key] = app[key]; });
      copy.demo = true;
      return normalizeApp(copy, index);
    });
  }

  function probeKnownApps() {
    var found = [];
    function nextBatch(start) {
      if (start >= KNOWN_APPS.length) return Promise.resolve(found);
      var batch = KNOWN_APPS.slice(start, start + 4);
      return Promise.all(batch.map(function (candidate, offset) {
        return callLuna("getAppLoadStatus", { appId:candidate.id }, 2200).then(function (result) {
          if (result.exist === true) found.push({ index:start + offset, app:candidate });
        }).catch(function () {});
      })).then(function () { return nextBatch(start + batch.length); });
    }
    return nextBatch(0).then(function () {
      return found.sort(function (left, right) { return left.index - right.index; }).map(function (item) { return item.app; });
    });
  }

  function listApps() {
    if (!isWebOS()) return Promise.resolve({ source:"demo", apps:demoApps() });
    return callLuna("listLaunchPoints", {}, 4500).then(function (result) {
      var apps = uniqueVisible(result.launchPoints || []);
      if (!apps.length) throw safeError("Nenhum launch point disponível", "EMPTY");
      return { source:"launchPoints", apps:apps };
    }).catch(function () {
      return callLuna("listApps", {}, 4500).then(function (result) {
        var apps = uniqueVisible(result.apps || []);
        if (!apps.length) throw safeError("Nenhum aplicativo disponível", "EMPTY");
        return { source:"apps", apps:apps };
      });
    }).catch(function () {
      return probeKnownApps().then(function (items) {
        var known = uniqueVisible(items);
        if (known.length) return { source:"knownApps", apps:known };
        return { source:"limited", apps:demoApps() };
      });
    });
  }

  function launchApp(app) {
    return new Promise(function (resolve, reject) {
      if (!app || !app.id) { reject(safeError("Aplicativo inválido", "INVALID_APP")); return; }
      if (!isWebOS() || app.demo) { reject(safeError("Item demonstrativo; teste o aplicativo real na TV", "DEMO")); return; }
      if (global.webOSDev && typeof global.webOSDev.launch === "function") {
        global.webOSDev.launch({
          id:app.id,
          params:app.params || {},
          onSuccess:function () { resolve(); },
          onFailure:function (result) { reject(safeError(result && result.errorText || "O webOS recusou a abertura", result && result.errorCode)); }
        });
        return;
      }
      callLuna("launch", { id:app.id, params:app.params || {} }, 4500).then(resolve, reject);
    });
  }

  function launchSystemApp(id) {
    return launchApp({ id:id, params:{}, demo:false });
  }

  function closeApp() {
    try { global.close(); } catch (error) {}
  }

  global.MendesPlatform = {
    isWebOS:isWebOS,
    currentAppId:currentAppId,
    listApps:listApps,
    launchApp:launchApp,
    launchSystemApp:launchSystemApp,
    closeApp:closeApp,
    demoApps:demoApps
  };
}(window));
