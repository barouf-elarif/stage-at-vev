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
    // Garder le thème quand on passe du CV à la page Centres d'intérêt (et inversement)
    document.querySelectorAll('a[href^="index.html"], a[href^="interets.html"]').forEach(function (a) {
      var base = a.getAttribute("href").replace(/\?[^#]*/, "");
      var page = base.split("#")[0], hash = base.indexOf("#") > -1 ? base.slice(base.indexOf("#")) : "";
      a.setAttribute("href", page + (choice === "auto" ? "" : "?theme=" + choice) + hash);
    });
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
  // Trouver la section : 8 clics de suite sur le score Elo (comme les 8 cases d'un côté de l'échiquier).
  // Ensuite chaque thème a son énigme :
  //  - Échecs     : 4 clics sur le score Elo (le mat du berger se joue en 4 coups)
  //  - Bloodborne : la nuit doit être tombée (thème Sombre ou Éclipse), puis 3 clics sur la place n°1 des jeux
  //  - Astro      : 5 clics sur la place n°2 des jeux (une pression par lettre de « ASTRO »)
  //  - God of War : le soleil doit être dévoré (thème Éclipse), puis 3 clics sur la place n°3 des jeux
  var secrets = document.getElementById("secrets");
  var NAMES = { bloodborne: "Bloodborne", astro: "Astro’s Playroom", ragnarok: "God of War", echecs: { fr: "Échecs", en: "Chess", es: "Ajedrez" } };
  var MSG = {
    unlocked: { fr: "🔓 Thème débloqué : ", en: "🔓 Theme unlocked: ", es: "🔓 Tema desbloqueado: " },
    relocked: { fr: "🔒 Tous les thèmes secrets sont à nouveau verrouillés.", en: "🔒 All secret themes are locked again.", es: "🔒 Todos los temas secretos vuelven a estar bloqueados." }
  };
  function lang() { return document.documentElement.lang || "fr"; }
  function currentTheme() { return document.documentElement.dataset.theme || "auto"; }

  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem("unlocked") || "[]"); } catch (e) { return []; }
  }
  function isUnlocked(id) { return getUnlocked().indexOf(id) > -1; }

  function refreshLocks() {
    document.querySelectorAll("[data-secret]").forEach(function (b) {
      b.classList.toggle("locked", !isUnlocked(b.dataset.secret));
    });
  }

  function toast(text) {
    var t = document.querySelector(".secret-toast");
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.hidden = true; }, 3500);
  }

  // Compte les clics rapides (moins de 1,5 s entre deux clics)
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
    var name = typeof NAMES[id] === "string" ? NAMES[id] : NAMES[id][lang()];
    toast(MSG.unlocked[lang()] + name);
  }

  if (secrets) {
    var found = false;
    try { found = localStorage.getItem("secrets") === "1"; } catch (e) {}
    if (found) secrets.hidden = false;
    refreshLocks();

    // Score Elo : 8 clics pour trouver la section, puis 4 clics pour le thème Échecs
    var elo = document.querySelector(".stat-value");
    if (elo) {
      var eloClicks = 0, eloTimer = null;
      elo.addEventListener("click", function () {
        eloClicks++;
        clearTimeout(eloTimer);
        eloTimer = setTimeout(function () { eloClicks = 0; }, 1500);
        if (secrets.hidden && eloClicks >= 8) {
          eloClicks = 0;
          secrets.hidden = false;
          try { localStorage.setItem("secrets", "1"); } catch (e) {}
          secrets.classList.remove("secret-reveal"); void secrets.offsetWidth; secrets.classList.add("secret-reveal");
          secrets.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (!secrets.hidden && eloClicks === 4) {
          eloClicks = 0;
          unlock("echecs");
        }
      });
    }

    var top = document.querySelectorAll("#jeux .top3:not(.top-rest) > li .rank");
    var night = function () { return ["dark", "eclipse"].indexOf(currentTheme()) > -1 ||
      (currentTheme() === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches); };
    // Mauvais thème : un petit message pour dire qu'on est sur la bonne piste
    var WRONG = {
      bloodborne: { fr: "☀️ Il fait encore jour… la chasse n’a pas commencé.", en: "☀️ It’s still daytime… the hunt hasn’t begun.", es: "☀️ Todavía es de día… la caza no ha empezado." },
      ragnarok:   { fr: "☀️ Le soleil brille encore… le Ragnarök n’a pas commencé.", en: "☀️ The sun is still shining… Ragnarök hasn’t begun.", es: "☀️ El sol aún brilla… el Ragnarök no ha empezado." }
    };
    onClicks(top[0], 3, function () {
      if (secrets.hidden || isUnlocked("bloodborne")) return;
      if (night()) unlock("bloodborne"); else toast(WRONG.bloodborne[lang()]);
    });
    onClicks(top[1], 5, function () { if (!secrets.hidden) unlock("astro"); });
    onClicks(top[2], 3, function () {
      if (secrets.hidden || isUnlocked("ragnarok")) return;
      if (currentTheme() === "eclipse") unlock("ragnarok"); else toast(WRONG.ragnarok[lang()]);
    });

    // Clic sur un thème verrouillé : afficher son indice
    document.querySelectorAll("[data-secret]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (!b.classList.contains("locked")) return;
        e.stopImmediatePropagation();
        b.parentElement.classList.add("show-hint");
        b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      }, true);
    });

    // Bouton pour tout reverrouiller et refaire les énigmes
    var reset = document.querySelector(".secret-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        try { localStorage.removeItem("unlocked"); localStorage.removeItem("secrets"); } catch (e) {}
        if (["bloodborne", "astro", "ragnarok", "echecs"].indexOf(currentTheme()) > -1) applyTheme("auto");
        document.querySelectorAll(".secret-item.show-hint").forEach(function (i) { i.classList.remove("show-hint"); });
        refreshLocks();
        toast(MSG.relocked[lang()]);
        setTimeout(function () {
          secrets.hidden = true;
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1200);
      });
    }
  }

  // ===== Téléphone : carrousel des parties du CV =====
  var track = document.querySelector("main.swipe");
  if (track) {
    var mq = window.matchMedia("(max-width: 700px)");
    var slides = Array.prototype.slice.call(track.querySelectorAll(".card"));
    var links = document.querySelectorAll('.nav a[href^="#"]');
    var current = null;

    function fit(card) {   // la hauteur du carrousel suit la partie affichée
      var cs = getComputedStyle(track);
      var bar = track.offsetHeight - track.clientHeight;   // barre de défilement éventuelle
      track.style.height = (card.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + bar + 4) + "px";
    }

    function setActive(card) {
      if (!card || card === current) return;
      current = card;
      fit(card);
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + card.id;
        a.classList.toggle("active", on);
        if (on) a.parentElement.scrollTo({ left: a.offsetLeft - 20, behavior: "smooth" });
      });
    }

    function nearest() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = null, dist = Infinity;
      slides.forEach(function (c) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = c; }
      });
      return best;
    }

    var t = null;
    track.addEventListener("scroll", function () {
      if (!mq.matches) return;
      clearTimeout(t);
      t = setTimeout(function () { setActive(nearest()); }, 80);
    }, { passive: true });

    // Un lien du menu (ou un bouton) vers une partie : on glisse jusqu'à elle
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !mq.matches) return;
      var card = document.getElementById(a.getAttribute("href").slice(1));
      if (!card || slides.indexOf(card) < 0) return;
      e.preventDefault();
      track.scrollTo({ left: card.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: "smooth" });
      setActive(card);
      var navH = document.querySelector(".nav").offsetHeight;
      var y = track.getBoundingClientRect().top + window.scrollY - navH - 10;
      window.scrollTo({ top: y, behavior: "smooth" });
    });

    // Une photo ou un menu qui s'ouvre dans une partie change sa hauteur
    if (window.ResizeObserver) {
      slides.forEach(function (c) { new ResizeObserver(function () { if (mq.matches && c === current) fit(c); }).observe(c); });
    }

    function onMq() {
      if (mq.matches) { current = null; setActive(nearest() || slides[0]); }
      else { track.style.height = ""; links.forEach(function (a) { a.classList.remove("active"); }); current = null; }
    }
    (mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq));
    onMq();
  }

  // Décorations des côtés : elles bougent quand on fait défiler la page
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--sy", window.scrollY);
      document.documentElement.style.setProperty("--sp", max > 0 ? Math.min(1, window.scrollY / max) : 0);
      ticking = false;
    });
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var saved = null;
  var fromUrl = location.search.match(/[?&]theme=([a-z]+)/);
  try { saved = fromUrl ? fromUrl[1] : localStorage.getItem("theme"); } catch (e) { saved = fromUrl && fromUrl[1]; }
  applyTheme(saved);
})();
