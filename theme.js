// Thèmes du site : menu déroulant + thèmes secrets (page Centres d'intérêt)
(function () {
  var THEMES = ["light", "dark", "violet", "vert", "orange", "eclipse", "noel",
                "bloodborne", "astro", "ragnarok", "echecs", "halloween"];
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
  //  - Échecs     : les deux rois face à face : le roi noir (n°1 des animés) puis le roi blanc (n°1 des jeux)
  //  - Bloodborne : le ciel noir et rouge (thème Éclipse), puis 3 clics sur la place n°1 des jeux
  //  - Astro      : la lumière allumée (thème Clair), puis 5 clics sur la place n°2 des jeux (une par lettre de « ASTRO »)
  //  - God of War : le grand hiver avant le Ragnarök (thème Noël, avec la neige), puis 3 clics sur la place n°3 des jeux
  var secrets = document.getElementById("secrets");
  var NAMES = { bloodborne: "Bloodborne", astro: "Astro’s Playroom", ragnarok: "God of War", echecs: { fr: "Échecs", en: "Chess", es: "Ajedrez" }, halloween: "Halloween", noel: { fr: "Noël", en: "Christmas", es: "Navidad" } };
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
    document.querySelectorAll("[data-secret], [data-menu-lock]").forEach(function (b) {
      b.classList.toggle("locked", !isUnlocked(b.dataset.secret || b.dataset.menuLock));
    });
  }

  function toast(text) {
    var t = document.querySelector(".site-toast");
    if (!t) {
      t = document.createElement("p");
      t.className = "secret-toast site-toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
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


  // ===== Thèmes de saison verrouillés dans le menu : Halloween et Noël =====
  // Chaque thème se débloque en trouvant deux objets cachés dans le haut de la page,
  // chacun visible seulement avec un certain thème.
  //   Halloween : une citrouille (thème Orange) + un balai (thème Violet)
  //   Noël      : une étoile (thème Vert, comme le sapin) + un flocon (thème Sombre, la nuit d'hiver)
  var EGGS = {
    pumpkin: { unlocks: "halloween", msg: { fr: "🎃 Citrouille trouvée !", en: "🎃 Pumpkin found!", es: "🎃 ¡Calabaza encontrada!" } },
    broom:   { unlocks: "halloween", msg: { fr: "🧹 Balai trouvé !", en: "🧹 Broom found!", es: "🧹 ¡Escoba encontrada!" } },
    star:    { unlocks: "noel", msg: { fr: "⭐ Étoile trouvée !", en: "⭐ Star found!", es: "⭐ ¡Estrella encontrada!" } },
    flake:   { unlocks: "noel", msg: { fr: "❄️ Flocon trouvé !", en: "❄️ Snowflake found!", es: "❄️ ¡Copo encontrado!" } }
  };
  var LOCK_HINT = {
    halloween: { fr: "🔒 Halloween est verrouillé. Une citrouille se cache dans le thème Orange, et un balai dans le thème Violet…",
                 en: "🔒 Halloween is locked. A pumpkin hides in the Orange theme, and a broom in the Purple theme…",
                 es: "🔒 Halloween está bloqueado. Una calabaza se esconde en el tema Naranja y una escoba en el tema Morado…" },
    noel:      { fr: "🔒 Noël est verrouillé. L’étoile du sapin se cache dans le thème Vert, et un flocon tombe dans la nuit du thème Sombre…",
                 en: "🔒 Christmas is locked. The tree’s star hides in the Green theme, and a snowflake falls in the night of the Dark theme…",
                 es: "🔒 Navidad está bloqueada. La estrella del árbol se esconde en el tema Verde y un copo cae en la noche del tema Oscuro…" }
  };
  function getEggs() { try { return JSON.parse(localStorage.getItem("eggs") || "[]"); } catch (e) { return []; } }

  var hero = document.querySelector(".hero");
  function placeEggs() {
    if (!hero) return;
    var found = getEggs();
    Object.keys(EGGS).forEach(function (id) {
      var b = hero.querySelector(".egg-" + id);
      if (!b) {
        b = document.createElement("button");
        b.type = "button";
        b.className = "egg egg-" + id;
        b.setAttribute("aria-label", id);
        hero.appendChild(b);
        b.addEventListener("click", function () {
          var list = getEggs();
          if (list.indexOf(id) < 0) list.push(id);
          try { localStorage.setItem("eggs", JSON.stringify(list)); } catch (err) {}
          // petite animation, puis l'objet disparaît
          b.classList.add("egg-pop");
          setTimeout(function () { b.classList.remove("egg-pop"); b.classList.add("egg-found"); }, 450);
          var target = EGGS[id].unlocks;
          var pair = Object.keys(EGGS).filter(function (k) { return EGGS[k].unlocks === target; });
          var got = pair.filter(function (k) { return list.indexOf(k) > -1; }).length;
          if (got === pair.length) unlock(target);
          else toast(EGGS[id].msg[lang()] + " (" + got + "/" + pair.length + ")");
        });
      }
      b.classList.toggle("egg-found", found.indexOf(id) > -1);
    });
  }
  placeEggs();

  // Thème verrouillé dans le menu : afficher l'indice au lieu de l'appliquer
  document.querySelectorAll("[data-menu-lock]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (!b.classList.contains("locked")) return;
      e.stopImmediatePropagation();
      toast(LOCK_HINT[b.dataset.menuLock][lang()]);
    }, true);
  });
  refreshLocks();

  if (secrets) {
    var found = false;
    try { found = localStorage.getItem("secrets") === "1"; } catch (e) {}
    if (found) secrets.hidden = false;
    refreshLocks();

    // Score Elo : 8 clics pour trouver la section
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
        }
      });
    }

    var top = document.querySelectorAll("#jeux .top3:not(.top-rest) > li .rank");
    // Mauvais thème : un petit message pour dire qu'on est sur la bonne piste
    var WRONG = {
      bloodborne: { fr: "☀️ Le soleil brille encore… la chasse n’a pas commencé.", en: "☀️ The sun is still shining… the hunt hasn’t begun.", es: "☀️ El sol aún brilla… la caza no ha empezado." },
      ragnarok:   { fr: "🍂 Il ne neige pas encore… le grand hiver n’est pas arrivé.", en: "🍂 It isn’t snowing yet… the great winter hasn’t come.", es: "🍂 Todavía no nieva… el gran invierno no ha llegado." },
      astro:      { fr: "🌙 Il fait trop sombre… le petit robot dort encore.", en: "🌙 It’s too dark… the little robot is still asleep.", es: "🌙 Está demasiado oscuro… el pequeño robot sigue durmiendo." },
      echecs:     { fr: "♚ Le roi noir attend son adversaire…", en: "♚ The black king is waiting for his opponent…", es: "♚ El rey negro espera a su rival…" }
    };
    var light = function () { return currentTheme() === "light" ||
      (currentTheme() === "auto" && !window.matchMedia("(prefers-color-scheme: dark)").matches); };
    onClicks(top[0], 3, function () {
      if (secrets.hidden || isUnlocked("bloodborne")) return;
      if (currentTheme() === "eclipse") unlock("bloodborne"); else toast(WRONG.bloodborne[lang()]);
    });
    onClicks(top[1], 5, function () {
      if (secrets.hidden || isUnlocked("astro")) return;
      if (light()) unlock("astro"); else toast(WRONG.astro[lang()]);
    });

    // Échecs : toucher le roi noir (n°1 des animés), puis le roi blanc (n°1 des jeux) dans les 4 secondes
    var blackKing = document.querySelector("#animes .top3:not(.top-rest) > li .rank");
    var blackTime = 0;
    if (blackKing) blackKing.addEventListener("click", function () {
      if (secrets.hidden || isUnlocked("echecs")) return;
      blackTime = Date.now();
      toast(WRONG.echecs[lang()]);
    });
    if (top[0]) top[0].addEventListener("click", function () {
      if (secrets.hidden || isUnlocked("echecs") || !blackTime) return;
      if (Date.now() - blackTime < 4000) { blackTime = 0; unlock("echecs"); }
    });
    onClicks(top[2], 3, function () {
      if (secrets.hidden || isUnlocked("ragnarok")) return;
      if (currentTheme() === "noel") unlock("ragnarok"); else toast(WRONG.ragnarok[lang()]);
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
        try { localStorage.removeItem("unlocked"); localStorage.removeItem("secrets"); localStorage.removeItem("eggs"); } catch (e) {}
        if (["bloodborne", "astro", "ragnarok", "echecs", "halloween", "noel"].indexOf(currentTheme()) > -1) applyTheme("auto");
        document.querySelectorAll(".secret-item.show-hint").forEach(function (i) { i.classList.remove("show-hint"); });
        refreshLocks(); placeEggs();
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
