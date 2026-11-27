// Thèmes du site : menu déroulant + thèmes secrets (page Centres d'intérêt)
(function () {
  var THEMES = ["light", "dark", "violet", "vert", "orange", "eclipse", "duolingo", "chess", "neon", "retro", "ocean", "carnet", "espace", "sakura", "terminal", "volcan", "bonbon", "manga", "vev", "lego", "noel",
                "bloodborne", "astro", "ragnarok", "echecs", "halloween", "premium", "lunesang", "mur", "gow3", "slime"];
  var menus = document.querySelectorAll(".theme-menu");   // « Thème » et « Thème 2 »
  var buttons = document.querySelectorAll("[data-theme-choice]");

  // Thèmes qu'il faut débloquer avant de pouvoir les utiliser
  var LOCKABLE = ["noel", "bloodborne", "astro", "ragnarok", "echecs", "halloween", "premium", "lunesang", "mur", "gow3", "slime"];
  // Thèmes en test : rangés dans le laboratoire caché, tous débloqués d'un coup avec lui
  var LAB_THEMES = ["duolingo", "chess", "neon", "retro", "ocean", "carnet", "espace", "sakura", "terminal", "volcan", "bonbon", "manga", "vev", "lego"];
  function keyFor(choice) {
    if (LAB_THEMES.indexOf(choice) > -1) return "labo";
    return LOCKABLE.indexOf(choice) > -1 ? choice : null;
  }

  function applyTheme(choice) {
    // Un thème verrouillé (venu de l'adresse ?theme=… ou de la mémoire) n'est jamais appliqué
    var key = keyFor(choice);
    // (Le Mur est aussi rangé dans le laboratoire : il marche si le laboratoire est débloqué)
    if (key && !isUnlocked(key) && !(choice === "mur" && isUnlocked("labo"))) {
      choice = "auto";
      if (/[?&]theme=/.test(location.search) && history.replaceState) {
        history.replaceState(null, "", location.pathname + location.hash);
      }
    }
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
      menus.forEach(function (m) { m.open = false; });
    });
  });

  // Ouvrir un menu ferme l'autre
  menus.forEach(function (m) {
    m.addEventListener("toggle", function () {
      if (m.open) menus.forEach(function (o) { if (o !== m) o.open = false; });
    });
  });

  // Fermer le menu quand on clique ailleurs
  document.addEventListener("click", function (e) {
    menus.forEach(function (m) { if (!m.contains(e.target)) m.open = false; });
  });

  // ===== Thèmes secrets =====
  // Trouver la section : 8 clics de suite sur le score Elo (comme les 8 cases d'un côté de l'échiquier).
  // Ensuite chaque thème a son énigme :
  //  - Échecs     : les deux rois face à face : le roi noir (n°1 des animés) puis le roi blanc (n°1 des jeux)
  //  - Bloodborne : le ciel noir et rouge (thème Éclipse), puis 3 clics sur la place n°1 des jeux
  //  - Astro      : la lumière allumée (thème Clair), puis 5 clics sur la place n°2 des jeux (une par lettre de « ASTRO »)
  //  - God of War : le grand hiver avant le Ragnarök (thème Noël, avec la neige), puis 3 clics sur la place n°3 des jeux
  //  - Slime Rancher : la couleur des carottes (thème Orange), puis 3 clics sur la place n°8 des jeux (le slime)
  var secrets = document.getElementById("secrets");
  var NAMES = { bloodborne: "Bloodborne", astro: "Astro’s Playroom", ragnarok: "God of War", echecs: { fr: "Échecs", en: "Chess", es: "Ajedrez" }, halloween: "Halloween", premium: { fr: "Échecs Premium", en: "Premium Chess", es: "Ajedrez Premium" }, lunesang: { fr: "Palesang", en: "Paleblood", es: "Sangre pálida" }, gow3: "God of War III", slime: "Slime Rancher", mur: { fr: "Le Mur", en: "The Wall", es: "El Muro" }, noel: { fr: "Noël", en: "Christmas", es: "Navidad" } };
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
    // Échecs Premium : l'indice n'apparaît qu'après Échecs, le bouton qu'après la promotion
    document.documentElement.classList.toggle("has-echecs", isUnlocked("echecs"));
    document.documentElement.classList.toggle("has-premium", isUnlocked("premium"));
    document.documentElement.classList.toggle("has-labo", isUnlocked("labo"));
    ["bloodborne", "lunesang", "mur", "ragnarok", "gow3", "slime"].forEach(function (id) { document.documentElement.classList.toggle("has-" + id, isUnlocked(id)); });
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
    if (typeof refreshLockAll === "function") refreshLockAll();
    var btn = document.querySelector('[data-secret="' + id + '"]');
    if (btn) { btn.classList.remove("just-unlocked"); void btn.offsetWidth; btn.classList.add("just-unlocked"); }
    var name = typeof NAMES[id] === "string" ? NAMES[id] : NAMES[id][lang()];
    toast(MSG.unlocked[lang()] + name);
  }


  // ===== Thèmes de saison verrouillés dans le menu : Halloween et Noël =====
  // Chaque thème se débloque en trouvant deux objets cachés dans le haut de la page,
  // chacun visible seulement avec un certain thème.
  //   Halloween : une citrouille (thème Orange) + un balai (thème Violet)
  //   Noël      : un sapin (thème Vert) + un flocon (thème Sombre, la nuit d'hiver)
  var EGGS = {
    pumpkin: { unlocks: "halloween", msg: { fr: "🎃 Citrouille trouvée !", en: "🎃 Pumpkin found!", es: "🎃 ¡Calabaza encontrada!" } },
    broom:   { unlocks: "halloween", msg: { fr: "🧹 Balai trouvé !", en: "🧹 Broom found!", es: "🧹 ¡Escoba encontrada!" } },
    tree:    { unlocks: "noel", msg: { fr: "🎄 Sapin trouvé !", en: "🎄 Tree found!", es: "🎄 ¡Árbol encontrado!" } },
    flake:   { unlocks: "noel", msg: { fr: "❄️ Flocon trouvé !", en: "❄️ Snowflake found!", es: "❄️ ¡Copo encontrado!" } }
  };
  var LOCK_HINT = {
    halloween: { fr: "🔒 Halloween est verrouillé. Une citrouille se cache dans le thème Orange, et un balai dans le thème Violet…",
                 en: "🔒 Halloween is locked. A pumpkin hides in the Orange theme, and a broom in the Purple theme…",
                 es: "🔒 Halloween está bloqueado. Una calabaza se esconde en el tema Naranja y una escoba en el tema Morado…" },
    noel:      { fr: "🔒 Noël est verrouillé. Un petit sapin se cache dans le thème Vert, et un flocon tombe dans la nuit du thème Sombre…",
                 en: "🔒 Christmas is locked. A little Christmas tree hides in the Green theme, and a snowflake falls in the night of the Dark theme…",
                 es: "🔒 Navidad está bloqueada. Un pequeño árbol de Navidad se esconde en el tema Verde y un copo cae en la noche del tema Oscuro…" }
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
      slime:      { fr: "🥕 Le slime renifle… cette couleur ne lui donne pas faim.", en: "🥕 The slime sniffs… this colour doesn’t make it hungry.", es: "🥕 El slime olfatea… este color no le da hambre." },
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
    // Slime Rancher : thème Orange (la couleur des carottes), puis 3 carottes au slime (place n°8 des jeux)
    var slimeRank = document.querySelectorAll("#jeux .top3.top-rest > li .rank")[4];
    onClicks(slimeRank, 3, function () {
      if (secrets.hidden || isUnlocked("slime")) return;
      if (currentTheme() === "orange") unlock("slime"); else toast(WRONG.slime[lang()]);
    });
    onClicks(top[2], 3, function () {
      if (secrets.hidden || isUnlocked("ragnarok")) return;
      if (currentTheme() === "noel") unlock("ragnarok"); else toast(WRONG.ragnarok[lang()]);
    });

    // Échecs Premium (encore plus secret) : la promotion du pion.
    // Avec le thème Échecs, toucher les pions blancs (places 4 à 10 des jeux) dans l'ordre,
    // sans s'arrêter plus de 2 secondes : le pion arrive au bout de l'échiquier et devient une dame d'or.
    var pawns = document.querySelectorAll("#jeux .top3.top-rest > li .rank");
    var step = 0, stepTimer = null;
    var PROMO = { fr: "♛ Promotion ! Thème débloqué : Échecs Premium", en: "♛ Promotion! Theme unlocked: Premium Chess", es: "♛ ¡Coronación! Tema desbloqueado: Ajedrez Premium" };
    pawns.forEach(function (pawn, i) {
      pawn.addEventListener("click", function () {
        if (secrets.hidden || !isUnlocked("echecs") || isUnlocked("premium") || currentTheme() !== "echecs") { step = 0; return; }
        clearTimeout(stepTimer);
        step = (i === step) ? step + 1 : (i === 0 ? 1 : 0);
        stepTimer = setTimeout(function () { step = 0; }, 2000);
        if (step === pawns.length) {
          step = 0;
          unlock("premium");
          if (window.premiumPromotion) window.premiumPromotion();   // cinématique (premium.js)
          setTimeout(function () { applyTheme("premium"); toast(PROMO[lang()]); }, 1200);
        }
      });
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
        applyTheme(currentTheme());   // retombe sur « automatique » si le thème vient d'être verrouillé
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

  // ===== Thèmes légendaires (encore plus secrets) : Palesang, Le Mur et God of War III =====
  // Effets et cinématiques dans legendes.js ; ici seulement la façon de les débloquer.
  function unlockLegend(id) {
    if (isUnlocked(id)) return;
    unlock(id);
    if (window.legendCinematic) window.legendCinematic(id);
    setTimeout(function () { applyTheme(id); }, 2600);
  }
  // Palesang : avec le thème Bloodborne, frapper trois fois la lune du haut de page
  // (ou être sur Bloodborne / Éclipse entre minuit et 1 h du matin)
  var moonHits = 0, moonTimer = null;
  function placeMoon() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var moon = hero.querySelector(".bb-moon");
    var show = currentTheme() === "bloodborne" && isUnlocked("bloodborne") && !isUnlocked("lunesang");
    if (show && !moon) {
      moon = document.createElement("button");
      moon.type = "button"; moon.className = "bb-moon"; moon.setAttribute("aria-label", "lune");
      hero.appendChild(moon);
      moon.addEventListener("click", function () {
        moonHits++;
        clearTimeout(moonTimer);
        moonTimer = setTimeout(function () { moonHits = 0; }, 2500);
        moon.classList.remove("hit"); void moon.offsetWidth; moon.classList.add("hit");
        if (moonHits >= 3) { moonHits = 0; moon.remove(); unlockLegend("lunesang"); }
        else toast({ fr: "🌕 La lune frémit… (", en: "🌕 The moon trembles… (", es: "🌕 La luna tiembla… (" }[lang()] + moonHits + "/3)");
      });
    } else if (!show && moon) moon.remove();
    if ((currentTheme() === "bloodborne" || currentTheme() === "eclipse") && isUnlocked("bloodborne") &&
        !isUnlocked("lunesang") && new Date().getHours() === 0) unlockLegend("lunesang");
  }
  new MutationObserver(placeMoon).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  setTimeout(placeMoon, 0);

  // Le Mur : section secrète trouvée, puis trois coups sous le nom de L'Attaque des Titans (page Centres d'intérêt)
  var wallLine = document.querySelector("#animes .top3:not(.top-rest) > li:first-child .meta");
  if (wallLine) {
    var wallHits = 0, wallTimer = null;
    wallLine.addEventListener("click", function () {
      if (!secrets || secrets.hidden || isUnlocked("mur")) return;
      wallHits++;
      clearTimeout(wallTimer);
      wallTimer = setTimeout(function () { wallHits = 0; }, 2500);
      wallLine.classList.remove("wall-shake"); void wallLine.offsetWidth; wallLine.classList.add("wall-shake");
      if (wallHits >= 3) { wallHits = 0; unlockLegend("mur"); }
      else toast({ fr: "🧱 Le mur tremble… (", en: "🧱 The wall shakes… (", es: "🧱 El muro tiembla… (" }[lang()] + wallHits + "/3)");
    });
  }

  // God of War III : avec le thème God of War, trois coups sous le nom du jeu (place n°3 des jeux) : retour en Grèce
  var gowLine = document.querySelector("#jeux .top3:not(.top-rest) > li:nth-child(3) .meta");
  if (gowLine) {
    var gowHits = 0, gowTimer = null;
    gowLine.addEventListener("click", function () {
      if (!secrets || secrets.hidden || !isUnlocked("ragnarok") || isUnlocked("gow3")) return;
      if (currentTheme() !== "ragnarok") {
        toast({ fr: "⚡ L’Olympe ne t’entend pas… reviens avec le thème God of War.", en: "⚡ Olympus can’t hear you… come back with the God of War theme.", es: "⚡ El Olimpo no te oye… vuelve con el tema God of War." }[lang()]);
        return;
      }
      gowHits++;
      clearTimeout(gowTimer);
      gowTimer = setTimeout(function () { gowHits = 0; }, 2500);
      gowLine.classList.remove("wall-shake"); void gowLine.offsetWidth; gowLine.classList.add("wall-shake");
      if (gowHits >= 3) { gowHits = 0; unlockLegend("gow3"); }
      else toast({ fr: "⚡ Le tonnerre gronde sur l’Olympe… (", en: "⚡ Thunder rumbles over Olympus… (", es: "⚡ El trueno retumba sobre el Olimpo… (" }[lang()] + gowHits + "/3)");
    });
  }

  // ===== Laboratoire caché (thèmes en test) =====
  // Pour l'ouvrir la première fois : rester appuyé 3 secondes sur le « © » tout en bas de la page
  // (ça marche aussi au doigt sur téléphone), ou taper « labo » au clavier n'importe où.
  // Ensuite un petit flacon 🧪 apparaît en bas à gauche de l'écran.
  var labBtn = document.querySelector(".labo-btn");
  var labPanel = document.querySelector(".labo-panel");
  var LAB_MSG = { fr: "🧪 Laboratoire débloqué ! Le flacon en bas à gauche ouvre mes thèmes en test.",
                  en: "🧪 Lab unlocked! The flask at the bottom left opens my test themes.",
                  es: "🧪 ¡Laboratorio desbloqueado! El frasco abajo a la izquierda abre mis temas de prueba." };
  function openLab(open) {
    if (!labPanel || !labBtn) return;
    labPanel.hidden = !open;
    labBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function closeLab() { openLab(false); }
  function unlockLab() {
    if (isUnlocked("labo")) { openLab(true); return; }
    var list = getUnlocked(); list.push("labo");
    try { localStorage.setItem("unlocked", JSON.stringify(list)); } catch (e) {}
    refreshLocks();
    if (typeof refreshLockAll === "function") refreshLockAll();
    if (labBtn) { labBtn.classList.remove("labo-pop"); void labBtn.offsetWidth; labBtn.classList.add("labo-pop"); }
    toast(LAB_MSG[lang()]);
    setTimeout(function () { openLab(true); }, 700);
  }
  if (labBtn) labBtn.addEventListener("click", function (e) { e.stopPropagation(); openLab(labPanel.hidden); });
  var labClose = document.querySelector(".labo-close");
  if (labClose) labClose.addEventListener("click", closeLab);
  document.addEventListener("click", function (e) {
    if (labPanel && !labPanel.hidden && !labPanel.contains(e.target) && e.target !== labBtn) closeLab();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLab(); });

  // Appui long sur le « © »
  var key = document.querySelector(".labo-key");
  if (key) {
    var pressTimer = null;
    var start = function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      key.classList.add("pressing");
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () { key.classList.remove("pressing"); unlockLab(); }, 3000);
    };
    var stop = function () { clearTimeout(pressTimer); key.classList.remove("pressing"); };
    key.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { key.addEventListener(ev, stop); });
    key.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // pas de menu au doigt
  }

  // Taper « labo » au clavier
  var typed = "";
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === "labo") { typed = ""; unlockLab(); }
  });

  // ===== Bouton à côté des drapeaux : tout débloquer / tout verrouiller =====
  var lockAll = document.querySelector(".lock-all");
  var ALL_LOCKED = ["bloodborne", "astro", "ragnarok", "echecs", "halloween", "noel", "premium", "lunesang", "mur", "gow3", "slime", "labo"];
  var LOCK_MSG = {
    open:   { fr: "🔓 Tous les thèmes sont débloqués !", en: "🔓 All themes are unlocked!", es: "🔓 ¡Todos los temas están desbloqueados!" },
    closed: { fr: "🔒 Tous les thèmes sont verrouillés.", en: "🔒 All themes are locked.", es: "🔒 Todos los temas están bloqueados." },
    tipOpen:   { fr: "Débloquer tous les thèmes", en: "Unlock all themes", es: "Desbloquear todos los temas" },
    tipClosed: { fr: "Verrouiller tous les thèmes", en: "Lock all themes", es: "Bloquear todos los temas" }
  };
  function allUnlocked() { return ALL_LOCKED.every(isUnlocked); }
  function refreshLockAll() {
    if (!lockAll) return;
    var open = allUnlocked();
    lockAll.textContent = open ? "🔒" : "🔓";
    var tip = (open ? LOCK_MSG.tipClosed : LOCK_MSG.tipOpen)[lang()];
    lockAll.title = tip; lockAll.setAttribute("aria-label", tip);
  }
  if (lockAll) {
    lockAll.addEventListener("click", function () {
      if (allUnlocked()) {
        // Tout verrouiller (comme le bouton « Tout reverrouiller » de la page Centres d'intérêt)
        try { localStorage.removeItem("unlocked"); localStorage.removeItem("secrets"); localStorage.removeItem("eggs"); } catch (e) {}
        if (secrets) secrets.hidden = true;
        closeLab();
        document.querySelectorAll(".secret-item.show-hint").forEach(function (i) { i.classList.remove("show-hint"); });
        toast(LOCK_MSG.closed[lang()]);
      } else {
        // Tout débloquer : thèmes, section secrète et objets cachés
        try {
          localStorage.setItem("unlocked", JSON.stringify(ALL_LOCKED));
          localStorage.setItem("secrets", "1");
          localStorage.setItem("eggs", JSON.stringify(Object.keys(EGGS)));
        } catch (e) {}
        if (secrets) secrets.hidden = false;
        toast(LOCK_MSG.open[lang()]);
      }
      refreshLocks(); placeEggs(); refreshLockAll();
      applyTheme(currentTheme());
    });
    // Le texte de l'infobulle suit la langue choisie
    new MutationObserver(refreshLockAll).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    refreshLockAll();
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

  // ===== Défilement : un rafraîchissement ramène en haut, et les liens « # » ne changent plus l'adresse =====
  // (avant, « Voir mon journal de stage » ajoutait #journal à l'adresse, et chaque rafraîchissement renvoyait au journal)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function dropHash() {
    if (location.hash && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }
  var navEntry = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  if (navEntry && navEntry.type === "reload") { dropHash(); window.scrollTo(0, 0); }
  else window.addEventListener("load", function () { setTimeout(dropHash, 50); });   // arrivée depuis l'autre page avec une ancre
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented) return;   // le carrousel du téléphone s'en occupe déjà
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  var saved = null;
  var fromUrl = location.search.match(/[?&]theme=([a-z]+)/);
  try { saved = fromUrl ? fromUrl[1] : localStorage.getItem("theme"); } catch (e) { saved = fromUrl && fromUrl[1]; }
  applyTheme(saved);
})();
