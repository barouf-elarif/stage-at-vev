// Thèmes du site : menu déroulant + thèmes secrets (page Centres d'intérêt)
(function () {
  var THEMES = ["light", "dark", "violet", "vert", "orange", "eclipse", "noel",
                "bloodborne", "astro", "ragnarok", "echecs"];
  var menu = document.querySelector(".theme-menu");
  var buttons = document.querySelectorAll("[data-theme-choice]");

  function applyTheme(choice) {
    if (THEMES.indexOf(choice) > -1) {
      document.documentElement.dataset.theme = choice;
    } else {
      delete document.documentElement.dataset.theme; // suit le réglage de l'appareil
      choice = "auto";
    }
    buttons.forEach(function (b) {
      b.classList.toggle("active", b.dataset.themeChoice === choice);
    });
    try { localStorage.setItem("theme", choice); } catch (e) {}
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      applyTheme(b.dataset.themeChoice);
      if (menu) menu.open = false;
    });
  });

  // Fermer le menu quand on clique ailleurs
  document.addEventListener("click", function (e) {
    if (menu && !menu.contains(e.target)) menu.open = false;
  });

  // ===== Thèmes secrets =====
  // 1) La section est cachée : 5 clics de suite sur le score Elo la font apparaître (et débloquent Échecs).
  // 2) Les autres thèmes sont verrouillés : 3 clics sur la place du jeu dans le top 3 les débloquent.
  var secrets = document.getElementById("secrets");
  var NAMES = { bloodborne: "Bloodborne", astro: "Astro’s Playroom", ragnarok: "God of War", echecs: { fr: "Échecs", en: "Chess", es: "Ajedrez" } };
  var MSG = { fr: "🔓 Thème débloqué : ", en: "🔓 Theme unlocked: ", es: "🔓 Tema desbloqueado: " };

  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem("unlocked") || "[]"); } catch (e) { return []; }
  }
  function isUnlocked(id) { return getUnlocked().indexOf(id) > -1; }

  function refreshLocks() {
    document.querySelectorAll("[data-secret]").forEach(function (b) {
      b.classList.toggle("locked", !isUnlocked(b.dataset.secret));
    });
  }

  function onClicks(el, needed, action) {
    if (!el) return;
    var clicks = 0, timer = null;
    el.addEventListener("click", function (e) {
      e.preventDefault();
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1500);
      if (clicks >= needed) { clicks = 0; action(); }
    });
  }

  function unlock(id) {
    if (isUnlocked(id)) return;
    var list = getUnlocked(); list.push(id);
    try { localStorage.setItem("unlocked", JSON.stringify(list)); } catch (e) {}
    refreshLocks();
    var btn = document.querySelector('[data-secret="' + id + '"]');
    if (btn) { btn.classList.remove("just-unlocked"); void btn.offsetWidth; btn.classList.add("just-unlocked"); }
    if (secrets && !secrets.hidden) {
      var lang = document.documentElement.lang || "fr";
      var name = typeof NAMES[id] === "string" ? NAMES[id] : NAMES[id][lang];
      var toast = secrets.querySelector(".secret-toast");
      toast.textContent = (MSG[lang] || MSG.fr) + name;
      toast.hidden = false;
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toast.hidden = true; }, 3500);
    }
  }

  if (secrets) {
    var found = false;
    try { found = localStorage.getItem("secrets") === "1"; } catch (e) {}
    if (found) secrets.hidden = false;
    refreshLocks();

    onClicks(document.querySelector(".stat-value"), 5, function () {
      var first = secrets.hidden;
      secrets.hidden = false;
      try { localStorage.setItem("secrets", "1"); } catch (e) {}
      if (first) {
        secrets.classList.add("secret-reveal");
        secrets.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      unlock("echecs");
    });

    // 3 clics sur la place 1, 2 ou 3 du top des jeux vidéo (seulement une fois la section trouvée)
    var top = document.querySelectorAll("#jeux .top3:not(.top-rest) > li .rank");
    ["bloodborne", "astro", "ragnarok"].forEach(function (id, i) {
      onClicks(top[i], 3, function () { if (!secrets.hidden) unlock(id); });
    });

    // Clic sur un thème verrouillé : afficher son indice
    document.querySelectorAll("[data-secret]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (!b.classList.contains("locked")) return;
        e.stopImmediatePropagation();
        var item = b.parentElement;
        item.classList.add("show-hint");
        b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      }, true);
    });
  }

  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(saved);
})();
