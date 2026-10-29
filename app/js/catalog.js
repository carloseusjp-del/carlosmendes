(function (global) {
  "use strict";

  var API_ROOT = "https://api.themoviedb.org/3";
  var IMAGE_ROOT = "https://image.tmdb.org/t/p/";
  var CREDENTIAL_KEY = "com.carlosmendes.mendeshome.tmdb-credential.v1";
  var CACHE_PREFIX = "com.carlosmendes.mendeshome.tmdb-cache.v1.";
  var CACHE_TTL = 6 * 60 * 60 * 1000;
  var STALE_TTL = 7 * 24 * 60 * 60 * 1000;
  var PATHS = {
    discover:"/trending/all/week",
    movies:"/trending/movie/week",
    series:"/trending/tv/week"
  };

  function storageGet(key) {
    try { return global.localStorage.getItem(key) || ""; }
    catch (error) { return ""; }
  }

  function storageSet(key, value) {
    try { global.localStorage.setItem(key, value); return true; }
    catch (error) { return false; }
  }

  function storageRemove(key) {
    try { global.localStorage.removeItem(key); }
    catch (error) {}
  }

  function credential() {
    return String(storageGet(CREDENTIAL_KEY) || "").trim();
  }

  function hasCredential() {
    return credential().length > 0;
  }

  function authFor(value) {
    var key = String(value || "").trim();
    if (key.indexOf("eyJ") === 0) {
      return { query:"", headers:{ Authorization:"Bearer " + key, Accept:"application/json" } };
    }
    return { query:"api_key=" + encodeURIComponent(key), headers:{ Accept:"application/json" } };
  }

  function catalogError(message, code) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var completed = false;
      var controller = typeof global.AbortController === "function" ? new global.AbortController() : null;
      var requestOptions = options || {};
      if (controller) requestOptions.signal = controller.signal;
      var timer = setTimeout(function () {
        if (completed) return;
        completed = true;
        if (controller) controller.abort();
        reject(catalogError("Tempo esgotado ao acessar a TMDB", "TIMEOUT"));
      }, timeoutMs || 8000);

      global.fetch(url, requestOptions).then(function (response) {
        if (completed) return;
        completed = true;
        clearTimeout(timer);
        resolve(response);
      }).catch(function () {
        if (completed) return;
        completed = true;
        clearTimeout(timer);
        reject(catalogError("Sem conexão com a TMDB", "NETWORK"));
      });
    });
  }

  function request(path, value, query) {
    var auth = authFor(value);
    var parts = [];
    if (query) parts.push(query);
    if (auth.query) parts.push(auth.query);
    var url = API_ROOT + path + (parts.length ? "?" + parts.join("&") : "");
    return fetchWithTimeout(url, { method:"GET", headers:auth.headers, cache:"no-store" }, 8000).then(function (response) {
      if (response.status === 401 || response.status === 403) throw catalogError("Chave recusada pela TMDB", "AUTH");
      if (response.status === 429) throw catalogError("Limite temporário da TMDB atingido", "RATE_LIMIT");
      if (!response.ok) throw catalogError("A TMDB respondeu com erro " + response.status, "HTTP");
      return response.json();
    });
  }

  function mediaTypeFor(item, view) {
    if (item.media_type === "movie" || item.media_type === "tv") return item.media_type;
    return view === "series" ? "tv" : "movie";
  }

  function normalize(item, view) {
    var mediaType = mediaTypeFor(item, view);
    var date = item.release_date || item.first_air_date || "";
    return {
      id:mediaType + ":" + item.id,
      tmdbId:item.id,
      mediaType:mediaType,
      title:item.title || item.name || "Sem título",
      overview:item.overview || "",
      year:date ? String(date).slice(0, 4) : "",
      rating:typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : 0,
      backdrop:item.backdrop_path || "",
      poster:item.poster_path || ""
    };
  }

  function normalizeResults(results, view) {
    var seen = {};
    return (Array.isArray(results) ? results : []).filter(function (item) {
      var mediaType = mediaTypeFor(item, view);
      if (!item || !item.id || item.adult === true || (mediaType !== "movie" && mediaType !== "tv")) return false;
      if (!item.backdrop_path && !item.poster_path) return false;
      var key = mediaType + ":" + item.id;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 12).map(function (item) { return normalize(item, view); });
  }

  function cacheKey(view) {
    return CACHE_PREFIX + view + ".pt-BR";
  }

  function sanitizeCachedItems(items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
      if (!item || (item.mediaType !== "movie" && item.mediaType !== "tv") || !item.title) return null;
      var rating = Number(item.rating);
      if (!isFinite(rating)) rating = 0;
      return {
        id:String(item.id || item.mediaType + ":" + item.tmdbId),
        tmdbId:item.tmdbId,
        mediaType:item.mediaType,
        title:String(item.title),
        overview:String(item.overview || ""),
        year:/^\d{4}$/.test(String(item.year || "")) ? String(item.year) : "",
        rating:Math.max(0, Math.min(10, rating)),
        backdrop:typeof item.backdrop === "string" ? item.backdrop : "",
        poster:typeof item.poster === "string" ? item.poster : ""
      };
    }).filter(function (item) { return item && (item.backdrop || item.poster); }).slice(0, 12);
  }

  function readCache(view) {
    try {
      var parsed = JSON.parse(storageGet(cacheKey(view)) || "null");
      if (!parsed || !Array.isArray(parsed.items) || typeof parsed.savedAt !== "number") return null;
      parsed.items = sanitizeCachedItems(parsed.items);
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeCache(view, items) {
    storageSet(cacheKey(view), JSON.stringify({ savedAt:Date.now(), items:items }));
  }

  function load(view) {
    var selected = PATHS[view] ? view : "discover";
    var cached = readCache(selected);
    var age = cached ? Date.now() - cached.savedAt : Infinity;
    if (cached && age < CACHE_TTL && cached.items.length >= 3) {
      return Promise.resolve({ source:"cache", items:cached.items, stale:false });
    }

    var key = credential();
    if (!key) return Promise.resolve({ source:"no-key", items:[], stale:false });

    return request(PATHS[selected], key, "language=pt-BR").then(function (result) {
      var items = normalizeResults(result.results, selected);
      if (!items.length) throw catalogError("A TMDB não retornou destaques com imagem", "EMPTY");
      writeCache(selected, items);
      return { source:"network", items:items, stale:false };
    }).catch(function (error) {
      if (cached && age < STALE_TTL && cached.items.length >= 3) {
        return { source:"stale-cache", items:cached.items, stale:true, errorCode:error.code };
      }
      error.catalogHandled = true;
      throw error;
    });
  }

  function validateCredential(value) {
    var candidate = String(value || "").trim();
    if (candidate.length < 20) return Promise.reject(catalogError("Digite uma API Key ou token válido", "FORMAT"));
    return request("/configuration", candidate, "").then(function () { return true; });
  }

  function saveCredential(value) {
    var candidate = String(value || "").trim();
    if (!candidate) return false;
    return storageSet(CREDENTIAL_KEY, candidate);
  }

  function removeCredential() {
    storageRemove(CREDENTIAL_KEY);
    Object.keys(PATHS).forEach(function (view) { storageRemove(cacheKey(view)); });
  }

  function imageUrl(item, wide, quality) {
    if (!item) return "";
    var path = wide ? (item.backdrop || item.poster) : (item.poster || item.backdrop);
    var full = quality === "full";
    var size = wide ? (full ? "w1280" : "w780") : (full ? "w500" : "w342");
    return path ? IMAGE_ROOT + size + path : "";
  }

  global.MendesCatalog = {
    load:load,
    validateCredential:validateCredential,
    saveCredential:saveCredential,
    removeCredential:removeCredential,
    hasCredential:hasCredential,
    imageUrl:imageUrl,
    authFor:authFor
  };
}(window));
