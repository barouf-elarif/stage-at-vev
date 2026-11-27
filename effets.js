// Effets des thèmes Palesang, God of War III et Slime Rancher (au même niveau que le thème Échecs Premium)
// Pour chaque thème :
//  - particules sur toute la page (cendres de sang, braises, bulles), traînée derrière la souris, explosion au clic
//  - un éclair de lumière quand on choisit le thème, un curseur spécial (dans style.css), des citations dans l'en-tête
//  - un compteur (Échos de sang, Orbes rouges, Newbucks) en bas à droite, un bouton pour couper les sons
//  - un mini-jeu (bouton en bas à droite) :
//      Palesang       : la chasse, frapper au bon moment pour une attaque viscérale
//      God of War III : le combat contre les dieux, appuyer sur le bon bouton à temps
//      Slime Rancher  : le ranch, donner à chaque slime la nourriture qu'il aime
//  - une boutique dans chaque mini-jeu : on dépense ses Échos, Orbes ou Newbucks pour des améliorations
//  - un événement quand on arrive tout en bas de la page
// Et des citations dans l'en-tête pour tous les autres thèmes secrets (Bloodborne, Astro, God of War, Échecs, Halloween, Noël).
(function () {
  var html = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var FX = ["lunesang", "gow3", "slime"];
  function theme() { return html.dataset.theme || "auto"; }
  function isFx() { return FX.indexOf(theme()) > -1; }
  function L(o) { return typeof o === "string" ? o : (o[html.lang] || o.fr); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function el(tag, cls, inner) { var e = document.createElement(tag); if (cls) e.className = cls; if (inner != null) e.innerHTML = inner; return e; }

  // =====================================================================
  // Sons (fabriqués par le navigateur ; même réglage 🔊 / 🔇 que le thème Premium)
  // =====================================================================
  var audio = null;
  function muted() { try { return localStorage.getItem("premium-mute") === "1"; } catch (e) { return false; } }
  function ac() {
    if (muted()) return null;
    if (!audio) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; audio = new A(); }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  function tone(f, f2, dur, vol, type, delay) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol, freq, type, delay) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0), len = Math.floor(c.sampleRate * dur);
    var b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = b; f.type = type || "lowpass"; f.frequency.value = freq || 800; g.gain.value = vol;
    n.connect(f).connect(g).connect(c.destination); n.start(t);
  }
  var SND = {
    lunesang: {
      hit: function () { noise(.15, .5, 2500, "bandpass"); tone(180, 60, .25, .3, "sawtooth"); },
      miss: function () { tone(120, 50, .45, .3, "square"); },
      win: function () { [220, 277, 330, 440].forEach(function (f, i) { tone(f, 0, 1.8, .12, "sine", i * .15); }); },
      coin: function () { tone(880, 440, .3, .08, "sine"); }
    },
    gow3: {
      hit: function () { noise(.12, .6, 3000, "highpass"); tone(220, 80, .2, .25, "sawtooth"); },
      miss: function () { noise(.45, .7, 150); },
      win: function () { [196, 247, 294, 392].forEach(function (f, i) { tone(f, 0, 1.6, .14, "triangle", i * .14); }); },
      coin: function () { tone(1200, 1800, .06, .05, "triangle"); }
    },
    slime: {
      hit: function () { tone(300, 800, .14, .25); },
      miss: function () { tone(300, 120, .25, .2, "triangle"); },
      win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0, .4, .15, "sine", i * .1); }); },
      coin: function () { tone(1046, 1568, .1, .1, "square"); }
    }
  };
  function snd(name) { var s = SND[theme()]; if (s && s[name]) s[name](); }

  // =====================================================================
  // Particules sur toute la page (une toile transparente au-dessus du site)
  // =====================================================================
  var CFG = {
    lunesang: { glow: 4,
      dust: { shape: "dot", colors: ["#ff4a3d", "#c4141f", "#7a0d16", "#e8dcd6"], r: [.6, 2], vy: .25, vx: .2, sway: .25, alpha: [.12, .35], max: 60, density: 24000 },
      trail: { shape: "drop", colors: ["#c4141f", "#8a0d16", "#ff4a3d"], g: .12, every: 40 },
      burst: { shape: "drop", colors: ["#c4141f", "#8a0d16", "#ff4a3d"], n: 18, power: 3.2, g: .16 } },
    gow3: { glow: 8,
      dust: { shape: "dot", colors: ["#ffb347", "#ff7a1a", "#ffd27a", "#ff4a1a"], r: [.8, 2.2], vy: -.55, vx: .3, sway: .4, alpha: [.3, .5], max: 70, density: 20000 },
      trail: { shape: "dot", colors: ["#ffb347", "#ff7a1a", "#ffd27a"], g: -.04, every: 28 },
      burst: { shape: "dot", colors: ["#fff3c4", "#ffb347", "#ff4a1a", "#d4af37"], n: 24, power: 4, g: -.02 } },
    slime: { glow: 0,
      dust: { shape: "bubble", colors: ["#ff9ad5", "#8fd3ff", "#ffd36b", "#8ee6a8"], r: [3, 9], vy: -.3, vx: .2, sway: .5, alpha: [.25, .35], max: 26, density: 40000 },
      trail: { shape: "dot", colors: ["#ff7ac8", "#ffd0ec", "#8fd3ff"], g: .05, every: 45 },
      burst: { shape: "dot", colors: ["#ff7ac8", "#ffd0ec", "#8fd3ff", "#ffd36b"], n: 14, power: 3, g: .1 } }
  };
  var canvas = null, ctx = null, w = 0, h = 0, parts = [], sparks = [], raf = 0, cfg = null;
  function resize() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function makeParts() {
    var d = cfg.dust, n = Math.round(Math.min(d.max, (w * h) / d.density));
    parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({ x: Math.random() * w, y: Math.random() * h, r: rnd(d.r[0], d.r[1]), vy: d.vy * rnd(.5, 1.5),
                   vx: (Math.random() - .5) * d.vx, t: Math.random() * 6.28, tw: rnd(.02, .05), c: pick(d.colors) });
    }
  }
  function draw(shape, x, y, r, c, a, vx, vy) {
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.strokeStyle = c; ctx.shadowColor = c;
    if (shape === "drop") {   // goutte : la pointe vers l'arrière
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(vy || 1, vx || 0) - Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -r * 2.4);
      ctx.quadraticCurveTo(r * 1.2, -r * .1, 0, r); ctx.quadraticCurveTo(-r * 1.2, -r * .1, 0, -r * 2.4);
      ctx.fill(); ctx.restore();
    } else if (shape === "bubble") {
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      ctx.globalAlpha = a * .7; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .35, r * .25, 0, 7); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowBlur = cfg.glow;
    var d = cfg.dust;
    parts.forEach(function (p) {
      p.t += p.tw; p.x += p.vx + Math.sin(p.t) * d.sway * .3; p.y += p.vy;
      if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; } else if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; }
      draw(d.shape, p.x, p.y, p.r, p.c, d.alpha[0] + d.alpha[1] * (.5 + .5 * Math.sin(p.t)), p.vx, p.vy);
    });
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += s.g; s.vx *= .97; s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      draw(s.shape, s.x, s.y, s.r * (.4 + .6 * s.life / s.max), s.c, Math.min(1, s.life / s.max * 1.4), s.vx, s.vy);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  }
  function burst(x, y, n, power) {
    if (!canvas || !cfg) return;
    var b = cfg.burst;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(.5, 1.5) * power, life = rnd(35, 65);
      sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (b.g > 0 ? 1.2 : 0), g: b.g,
                    r: rnd(1.3, 3), c: pick(b.colors), shape: b.shape, life: life, max: life });
    }
  }
  function startCanvas() {
    if (calm) return;
    cfg = CFG[theme()];
    if (!canvas) {
      canvas = el("canvas", "fx-canvas");
      canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
    }
    if (!canvas.parentNode) document.body.appendChild(canvas);
    resize(); makeParts(); sparks = [];
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function stopCanvas() {
    cancelAnimationFrame(raf); sparks = []; cfg = null;
    if (canvas && canvas.parentNode) canvas.remove();
  }
  window.addEventListener("resize", function () { if (cfg) { resize(); makeParts(); } });
  var lastTrail = 0;
  if (finePointer) window.addEventListener("mousemove", function (e) {
    if (!cfg || !canvas || !canvas.parentNode) return;
    var now = performance.now(), t = cfg.trail;
    if (now - lastTrail < t.every) return;
    lastTrail = now;
    var life = rnd(22, 36);
    sparks.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * .8, vy: Math.random() * .6, g: t.g,
                  r: rnd(1, 2.4), c: pick(t.colors), shape: t.shape, life: life, max: life });
  }, { passive: true });

  // =====================================================================
  // Citations dans l'en-tête
  // =====================================================================
  var QUOTES = {
    lunesang: [
      { a: "Bloodborne", fr: "Craignez le sang ancien.", en: "Fear the Old Blood.", es: "Teme a la sangre antigua." },
      { a: { fr: "Eileen la Corneille", en: "Eileen the Crow", es: "Eileen la Cuerva" }, fr: "Un chasseur doit chasser.", en: "A hunter must hunt.", es: "Un cazador debe cazar." },
      { a: { fr: "Note d’un chasseur", en: "A hunter’s note", es: "Nota de un cazador" }, fr: "Cherche le sang pâle pour transcender la chasse.", en: "Seek paleblood to transcend the hunt.", es: "Busca la sangre pálida para trascender la caza." },
      { a: { fr: "La Poupée", en: "The Doll", es: "La Muñeca" }, fr: "Puisses-tu trouver ta valeur dans le monde éveillé.", en: "May you find your worth in the waking world.", es: "Que encuentres tu valía en el mundo de la vigilia." }
    ],
    gow3: [
      { a: "Kratos", fr: "Zeus ! Ton fils est de retour ! J’apporte la destruction de l’Olympe !", en: "Zeus! Your son has returned! I bring the destruction of Olympus!", es: "¡Zeus! ¡Tu hijo ha vuelto! ¡Traigo la destrucción del Olimpo!" },
      { a: { fr: "Temple de Delphes", en: "Temple of Delphi", es: "Templo de Delfos" }, fr: "Connais-toi toi-même.", en: "Know thyself.", es: "Conócete a ti mismo." },
      { a: { fr: "Héraclite", en: "Heraclitus", es: "Heráclito" }, fr: "Le caractère d’un homme est son destin.", en: "A man’s character is his destiny.", es: "El carácter de un hombre es su destino." },
      { a: { fr: "Homère, l’Iliade", en: "Homer, the Iliad", es: "Homero, la Ilíada" }, fr: "Chante, déesse, la colère d’Achille…", en: "Sing, goddess, the anger of Achilles…", es: "Canta, oh diosa, la cólera de Aquiles…" }
    ],
    slime: [
      { a: { fr: "Conseil du ranch", en: "Ranch tip", es: "Consejo del rancho" }, fr: "Les slimes roses mangent de tout : légumes, fruits et viande.", en: "Pink slimes eat everything: veggies, fruit and meat.", es: "Los slimes rosas comen de todo: verduras, fruta y carne." },
      { a: { fr: "Conseil du ranch", en: "Ranch tip", es: "Consejo del rancho" }, fr: "Un slime bien nourri produit un plort, qu’on peut vendre au marché.", en: "A well-fed slime makes a plort, which you can sell at the market.", es: "Un slime bien alimentado produce un plort, que se puede vender en el mercado." },
      { a: { fr: "Conseil du ranch", en: "Ranch tip", es: "Consejo del rancho" }, fr: "Un slime qui mange le plort d’un autre slime devient un Largo !", en: "A slime that eats another slime’s plort becomes a Largo!", es: "¡Un slime que se come el plort de otro slime se convierte en un Largo!" },
      { a: { fr: "Conseil du ranch", en: "Ranch tip", es: "Consejo del rancho" }, fr: "Les slimes dorés sont rares : attrape-les vite, ils valent une fortune.", en: "Gold slimes are rare: catch them fast, they’re worth a fortune.", es: "Los slimes dorados son raros: atrápalos rápido, valen una fortuna." }
    ]
  };
  QUOTES.bloodborne = [
    { a: { fr: "La Poupée", en: "The Doll", es: "La Muñeca" }, fr: "Bonjour, bon chasseur. Je suis une poupée, ici dans ce rêve pour veiller sur toi.", en: "Hello, good hunter. I am a Doll, here in this dream to look after you.", es: "Hola, buen cazador. Soy una muñeca, aquí en este sueño para cuidar de ti." },
    { a: { fr: "Maître Willem", en: "Master Willem", es: "Maestro Willem" }, fr: "Nous sommes nés du sang, faits hommes par le sang, défaits par le sang.", en: "We are born of the blood, made men by the blood, undone by the blood.", es: "Nacemos de la sangre, la sangre nos hace hombres, la sangre nos deshace." },
    { a: "Gehrman", fr: "Ce soir, Gehrman se joint à la chasse.", en: "Tonight, Gehrman joins the hunt.", es: "Esta noche, Gehrman se une a la caza." }
  ];
  QUOTES.astro = [
    { a: { fr: "Le saviez-vous ?", en: "Did you know?", es: "¿Sabías que…?" }, fr: "Astro’s Playroom se passe à l’intérieur d’une PlayStation 5.", en: "Astro’s Playroom takes place inside a PlayStation 5.", es: "Astro’s Playroom transcurre dentro de una PlayStation 5." },
    { a: { fr: "Le saviez-vous ?", en: "Did you know?", es: "¿Sabías que…?" }, fr: "Le jeu est installé sur chaque PS5 pour faire découvrir la manette DualSense.", en: "The game comes installed on every PS5 to show off the DualSense controller.", es: "El juego viene instalado en cada PS5 para descubrir el mando DualSense." },
    { a: { fr: "Le saviez-vous ?", en: "Did you know?", es: "¿Sabías que…?" }, fr: "Les mondes portent le nom de pièces de la console : GPU Jungle, Cooling Springs, SSD Speedway, Memory Meadow.", en: "The worlds are named after parts of the console: GPU Jungle, Cooling Springs, SSD Speedway, Memory Meadow.", es: "Los mundos llevan el nombre de piezas de la consola: GPU Jungle, Cooling Springs, SSD Speedway, Memory Meadow." }
  ];
  QUOTES.ragnarok = [
    { a: "Kratos", fr: "Ne sois pas désolé. Sois meilleur.", en: "Don’t be sorry. Be better.", es: "No lo sientas. Sé mejor." },
    { a: { fr: "Hávamál (poème nordique)", en: "Hávamál (Norse poem)", es: "Hávamál (poema nórdico)" }, fr: "Le bétail meurt, les parents meurent, et toi aussi tu mourras ; mais la renommée ne meurt jamais pour celui qui l’a bien gagnée.", en: "Cattle die, kinsmen die, you yourself will die; but fame never dies for the one who has earned it well.", es: "Muere el ganado, mueren los parientes, tú también morirás; pero la fama nunca muere para quien la ganó bien." },
    { a: { fr: "Mythologie nordique", en: "Norse mythology", es: "Mitología nórdica" }, fr: "Avant le Ragnarök vient le Fimbulvetr : trois hivers de suite, sans aucun été.", en: "Before Ragnarök comes Fimbulwinter: three winters in a row, with no summer.", es: "Antes del Ragnarök llega el Fimbulvetr: tres inviernos seguidos, sin ningún verano." }
  ];
  QUOTES.echecs = [
    { a: "Savielly Tartakower", fr: "La partie est gagnée par celui qui fait l’avant-dernière erreur.", en: "The winner of the game is the player who makes the next-to-last mistake.", es: "La partida la gana quien comete el penúltimo error." },
    { a: "José Raúl Capablanca", fr: "Pour progresser, il faut d’abord étudier les finales.", en: "To improve your game, you must study the endgame before everything else.", es: "Para mejorar, hay que estudiar los finales antes que nada." },
    { a: "Bobby Fischer", fr: "Les échecs, c’est la vie.", en: "Chess is life.", es: "El ajedrez es la vida." }
  ];
  QUOTES.halloween = [
    { a: "Edgar Allan Poe", fr: "Tout ce que nous voyons ou paraissons n’est qu’un rêve dans un rêve.", en: "All that we see or seem is but a dream within a dream.", es: "Todo lo que vemos o parecemos no es más que un sueño dentro de un sueño." },
    { a: { fr: "Mary Shelley, Frankenstein", en: "Mary Shelley, Frankenstein", es: "Mary Shelley, Frankenstein" }, fr: "Prends garde, car je suis sans peur, et donc puissant.", en: "Beware; for I am fearless, and therefore powerful.", es: "Ten cuidado, porque no tengo miedo, y por eso soy poderoso." }
  ];
  QUOTES.noel = [
    { a: { fr: "Charles Dickens, Un chant de Noël", en: "Charles Dickens, A Christmas Carol", es: "Charles Dickens, Cuento de Navidad" }, fr: "J’honorerai Noël dans mon cœur, et j’essaierai de le garder toute l’année.", en: "I will honour Christmas in my heart, and try to keep it all the year.", es: "Honraré la Navidad en mi corazón y trataré de conservarla todo el año." },
    { a: "Clement Clarke Moore", fr: "Joyeux Noël à tous, et à tous une bonne nuit !", en: "Happy Christmas to all, and to all a good night!", es: "¡Feliz Navidad a todos, y a todos buenas noches!" }
  ];
  var QUOTE_ONLY = ["bloodborne", "astro", "ragnarok", "echecs", "halloween", "noel"];   // thèmes secrets avec seulement des citations
  // La citation garde la hauteur de la plus longue déjà affichée : la page ne bouge plus quand elle change
  // (sinon un menu déroulant ouvert plus bas, comme « Voiture » du simulateur, se refermait tout seul)
  function holdHeight(q) {
    var h = q.offsetHeight;
    if (h > (q._h || 0)) { q._h = h; q.style.minHeight = h + "px"; }
  }
  // Ne pas changer la citation pendant qu'on utilise un menu ou un champ
  function busyForm() { var a = document.activeElement; return !!a && /^(SELECT|INPUT|TEXTAREA)$/.test(a.tagName); }
  window.addEventListener("resize", function () { var q = document.querySelector(".fx-quote"); if (q) { q._h = 0; q.style.minHeight = ""; } });
  var quoteEl = null, quoteTimer = 0, quoteI = 0;
  function paintQuote() {
    var q = QUOTES[theme()]; if (!q || !quoteEl) return;
    var it = q[quoteI % q.length];
    quoteEl.innerHTML = "« " + L(it) + " »<cite>— " + L(it.a) + "</cite>";
    holdHeight(quoteEl);
  }
  function showQuotes(on) {
    var dates = document.querySelector(".hero .dates") || document.querySelector(".hero h1");
    if (on && dates) {
      if (!quoteEl) { quoteEl = el("blockquote", "pq fx-quote"); dates.parentNode.insertBefore(quoteEl, dates.nextSibling); }
      quoteI = Math.floor(Math.random() * QUOTES[theme()].length);
      paintQuote();
      clearInterval(quoteTimer);
      if (!calm) quoteTimer = setInterval(function () {
        if (busyForm()) return;
        if (!quoteEl) return;
        quoteEl.classList.add("pq-out");
        setTimeout(function () { if (!quoteEl) return; quoteI++; paintQuote(); quoteEl.classList.remove("pq-out"); }, 500);
      }, 7000);
    } else if (!on && quoteEl) { clearInterval(quoteTimer); quoteEl.remove(); quoteEl = null; }
  }

  // =====================================================================
  // Compteur en bas à droite : Échos de sang, Orbes rouges, Newbucks
  // =====================================================================
  var COUNTER = {
    lunesang: { key: "fx-echoes", icon: "🩸", label: { fr: "Échos de sang", en: "Blood Echoes", es: "Ecos de sangre" } },
    gow3: { key: "fx-orbs", icon: "🔴", label: { fr: "Orbes rouges", en: "Red Orbs", es: "Orbes rojos" } },
    slime: { key: "fx-newbucks", icon: "🪙", label: { fr: "Newbucks", en: "Newbucks", es: "Newbucks" } }
  };
  var counterEl = null;
  function paintCounter() {
    var c = COUNTER[theme()]; if (!counterEl || !c) return;
    counterEl.innerHTML = '<span class="fx-c-icon">' + c.icon + "</span><b>" + load(c.key, 0).toLocaleString(html.lang || "fr") +
                          '</b><span class="fx-c-label">' + L(c.label) + "</span>";
  }
  function addPoints(n) {
    var c = COUNTER[theme()]; if (!c) return;
    var before = load(c.key, 0), after = before + n;
    save(c.key, after);
    paintCounter();
    if (counterEl) { counterEl.classList.remove("bump"); void counterEl.offsetWidth; counterEl.classList.add("bump"); }
    milestone(before, after);
  }
  // Paliers : les Lames du Chaos montent de niveau, le ranch fait naître un Largo
  function milestone(before, after) {
    var th = theme();
    if (th === "gow3" && Math.floor(after / 250) > Math.floor(before / 250)) {
      bubble({ fr: "⚔️ Lames du Chaos : niveau ", en: "⚔️ Blades of Chaos: level ", es: "⚔️ Espadas del Caos: nivel " }[html.lang] + (Math.floor(after / 250) + 1) + " !");
      snd("win");
    }
    if (th === "lunesang" && Math.floor(after / 1000) > Math.floor(before / 1000)) {
      bubble({ fr: "👁️ Tu gagnes une Révélation…", en: "👁️ You gain Insight…", es: "👁️ Ganas Perspicacia…" }[html.lang]);
    }
    if (th === "slime" && before < 250 && after >= 250 && !load("fx-largo", false)) {
      save("fx-largo", true);
      bubble({ fr: "🎉 Ton premier Largo est né dans le ranch !", en: "🎉 Your first Largo was born on the ranch!", es: "🎉 ¡Tu primer Largo ha nacido en el rancho!" }[html.lang]);
      snd("win");
      if (slimeField) addHeroSlime(LARGO, 46, true);
    }
  }
  // Petit message au-dessus du compteur
  function bubble(text) {
    var b = el("div", "fx-bubble", null);
    b.textContent = text;
    document.body.appendChild(b);
    setTimeout(function () { b.classList.add("out"); }, 2600);
    setTimeout(function () { b.remove(); }, 3200);
  }
  // Une pièce (orbe, plort…) qui vole jusqu'au compteur
  function flyTo(x, y, cls, done) {
    if (!counterEl || calm) { if (done) done(); return; }
    var f = el("span", "fx-fly " + cls);
    f.style.left = x + "px"; f.style.top = y + "px";
    document.body.appendChild(f);
    var r = counterEl.getBoundingClientRect();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        f.style.transform = "translate(" + (r.left + 18 - x) + "px," + (r.top + r.height / 2 - y) + "px) scale(.6)";
        f.style.opacity = ".2";
      });
    });
    setTimeout(function () { f.remove(); if (done) done(); }, 720);
  }

  // =====================================================================
  // Boutons en bas à droite : sons et mini-jeu
  // =====================================================================
  var GAME_ICON = { lunesang: "🩸", gow3: "⚡", slime: "🥕" };
  var GAME_NAME = {
    lunesang: { fr: "La chasse", en: "The hunt", es: "La caza" },
    gow3: { fr: "Combat contre les dieux", en: "Fight the gods", es: "Combate contra los dioses" },
    slime: { fr: "Mon ranch", en: "My ranch", es: "Mi rancho" }
  };
  var muteBtn = null, gameBtn = null, panel = null, gameStop = null;
  function showUi(on) {
    if (on) {
      if (!muteBtn) {
        muteBtn = el("button", "fx-mute fx-ui");
        muteBtn.type = "button";
        muteBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          try { localStorage.setItem("premium-mute", muted() ? "0" : "1"); } catch (err) {}
          paintMute();
        });
        document.body.appendChild(muteBtn);
      }
      paintMute();
      if (!gameBtn) {
        gameBtn = el("button", "fx-game fx-ui");
        gameBtn.type = "button";
        gameBtn.addEventListener("click", function (e) { e.stopPropagation(); panel ? closePanel() : openPanel(); });
        document.body.appendChild(gameBtn);
      }
      gameBtn.textContent = GAME_ICON[theme()];
      gameBtn.title = L(GAME_NAME[theme()]); gameBtn.setAttribute("aria-label", gameBtn.title);
      if (!counterEl) { counterEl = el("div", "fx-counter fx-ui"); counterEl.setAttribute("aria-live", "polite"); document.body.appendChild(counterEl); }
      paintCounter();
    } else {
      closePanel();
      [muteBtn, gameBtn, counterEl].forEach(function (b) { if (b) b.remove(); });
      muteBtn = gameBtn = counterEl = null;
    }
  }
  function paintMute() {
    if (!muteBtn) return;
    muteBtn.textContent = muted() ? "🔇" : "🔊";
    muteBtn.title = muted() ? L({ fr: "Activer les sons", en: "Turn sounds on", es: "Activar sonidos" }) : L({ fr: "Couper les sons", en: "Mute sounds", es: "Silenciar" });
  }
  function openPanel() {
    closePanel();
    panel = el("div", "fx-panel fx-ui");
    panel.setAttribute("role", "dialog");
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.body.appendChild(panel);
    if (gameBtn) gameBtn.setAttribute("aria-expanded", "true");
    GAMES[theme()].open();
  }
  function closePanel() {
    if (gameStop) { gameStop(); gameStop = null; }
    if (panel) { panel.remove(); panel = null; }
    if (gameBtn) gameBtn.setAttribute("aria-expanded", "false");
  }
  document.addEventListener("click", function (e) { if (panel && !panel.contains(e.target) && e.target !== gameBtn) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
  function closeBtn() { return '<button type="button" class="fx-close" aria-label="' + L({ fr: "Fermer", en: "Close", es: "Cerrar" }) + '">×</button>'; }
  function wireClose() { var c = panel.querySelector(".fx-close"); if (c) c.addEventListener("click", closePanel); }
  function shake() { if (!panel) return; panel.classList.remove("fx-shake"); void panel.offsetWidth; panel.classList.add("fx-shake"); }
  function pips(n, max, on, off) { var s = ""; for (var i = 0; i < max; i++) s += i < n ? on : off; return s; }

  // =====================================================================
  // Mini-jeu de Palesang : la chasse
  // Une lame va et vient sur une barre ; il faut frapper quand elle est dans la zone rouge.
  // =====================================================================
  var BOSSES = [
    { n: { fr: "Père Gascoigne", en: "Father Gascoigne", es: "Padre Gascoigne" }, speed: .7, zone: .24 },
    { n: { fr: "Ludwig, l’Épée sacrée", en: "Ludwig, the Holy Blade", es: "Ludwig, la Espada Sagrada" }, speed: .9, zone: .21 },
    { n: { fr: "Lady Maria", en: "Lady Maria", es: "Lady María" }, speed: 1.1, zone: .18 },
    { n: { fr: "Gehrman, le premier chasseur", en: "Gehrman, the First Hunter", es: "Gehrman, el Primer Cazador" }, speed: 1.3, zone: .16 },
    { n: { fr: "La Présence de la Lune", en: "Moon Presence", es: "La Presencia Lunar" }, speed: 1.55, zone: .14 }
  ];
  var HT = {
    title: { fr: "La chasse", en: "The hunt", es: "La caza" },
    help: { fr: "Frappe quand la lame est dans la zone rouge (clic, ou barre d’espace) : attaque viscérale !", en: "Strike when the blade is in the red zone (click, or space bar): visceral attack!", es: "Golpea cuando la hoja esté en la zona roja (clic o barra espaciadora): ¡ataque visceral!" },
    strike: { fr: "⚔ Frapper", en: "⚔ Strike", es: "⚔ Golpear" },
    hit: { fr: "Attaque viscérale !", en: "Visceral attack!", es: "¡Ataque visceral!" },
    miss: { fr: "Raté… la bête te frappe !", en: "Missed… the beast strikes you!", es: "Fallaste… ¡la bestia te golpea!" },
    win: { fr: "PROIE ABATTUE", en: "PREY SLAUGHTERED", es: "PRESA ABATIDA" },
    dead: { fr: "VOUS ÊTES MORT", en: "YOU DIED", es: "HAS MUERTO" },
    next: { fr: "Proie suivante ›", en: "Next prey ›", es: "Siguiente presa ›" },
    retry: { fr: "Réessayer", en: "Try again", es: "Reintentar" },
    all: { fr: "Tu as vaincu toute la chasse. Le cauchemar est terminé.", en: "You have conquered the whole hunt. The nightmare is over.", es: "Has vencido toda la caza. La pesadilla ha terminado." },
    count: { fr: "Proies abattues", en: "Prey slaughtered", es: "Presas abatidas" },
    vials: { fr: "Fioles de sang", en: "Blood vials", es: "Viales de sangre" }
  };
  var hunt = null;
  function huntOpen(i) {
    var kills = load("fx-hunt", 0);
    if (i === undefined) i = Math.min(kills, BOSSES.length - 1);
    var B = BOSSES[i];
    var zone = B.zone * (owned("rune") ? 1.4 : 1), vials = owned("fiole") ? 4 : 3;
    hunt = { i: i, boss: 3, hp: vials, maxHp: vials, dmg: owned("lame") ? 2 : 1, p: 0, dir: 1, zone: zone, zl: rnd(.1, .9 - zone), over: false, last: 0, raf: 0 };
    panel.className = "fx-panel fx-ui fx-hunt";
    panel.innerHTML = closeBtn() +
      '<p class="fx-title">🩸 ' + L(HT.title) + "</p>" +
      '<p class="fx-foe">' + L(B.n) + '</p><p class="fx-foe-hp"></p>' +
      '<p class="fx-help">' + L(HT.help) + "</p>" +
      '<div class="hunt-bar"><span class="hunt-zone"></span><span class="hunt-blade"></span></div>' +
      '<button type="button" class="fx-action hunt-strike">' + L(HT.strike) + "</button>" +
      '<p class="fx-msg" role="status" aria-live="polite"></p>' +
      '<div class="fx-foot"><span class="fx-me"></span><span class="fx-count">' + L(HT.count) + " : " + kills + " / " + BOSSES.length + '</span></div>' +
      '<button type="button" class="fx-next" hidden></button>' + shopButton();
    wireClose(); wireShop();
    panel.querySelector(".hunt-strike").addEventListener("click", huntStrike);
    huntPaint();
    hunt.raf = requestAnimationFrame(huntLoop);
    gameStop = function () { if (hunt) cancelAnimationFrame(hunt.raf); hunt = null; };
  }
  function huntPaint() {
    if (!panel || !hunt) return;
    panel.querySelector(".fx-foe-hp").innerHTML = pips(Math.max(0, hunt.boss), 3, '<i class="on"></i>', "<i></i>");
    panel.querySelector(".fx-me").innerHTML = L(HT.vials) + " " + pips(hunt.hp, hunt.maxHp, "🩸", '<span class="off">🩸</span>');
    var z = panel.querySelector(".hunt-zone");
    z.style.left = (hunt.zl * 100) + "%"; z.style.width = (hunt.zone * 100) + "%";
  }
  function huntLoop(t) {
    if (!hunt || !panel) return;
    if (!hunt.last) hunt.last = t;
    var dt = Math.min(.05, (t - hunt.last) / 1000); hunt.last = t;
    if (!hunt.over) {
      hunt.p += hunt.dir * BOSSES[hunt.i].speed * dt;
      if (hunt.p > 1) { hunt.p = 1; hunt.dir = -1; } else if (hunt.p < 0) { hunt.p = 0; hunt.dir = 1; }
      panel.querySelector(".hunt-blade").style.left = (hunt.p * 100) + "%";
    }
    hunt.raf = requestAnimationFrame(huntLoop);
  }
  function huntStrike() {
    if (!hunt || hunt.over) return;
    var msg = panel.querySelector(".fx-msg");
    var inZone = hunt.p >= hunt.zl && hunt.p <= hunt.zl + hunt.zone;
    if (inZone) {
      hunt.boss -= hunt.dmg; snd("hit");
      var r = panel.querySelector(".hunt-bar").getBoundingClientRect();
      burst(r.left + hunt.p * r.width, r.top + r.height / 2, 30, 4);
      msg.textContent = L(HT.hit); msg.className = "fx-msg good";
      hunt.zl = rnd(.08, .92 - hunt.zone);
      if (hunt.boss <= 0) {
        hunt.over = true;
        var kills = Math.max(load("fx-hunt", 0), hunt.i + 1);
        save("fx-hunt", kills);
        addPoints(300 * (hunt.i + 1));
        snd("win");
        msg.innerHTML = '<span class="fx-big win">' + L(HT.win) + "</span>" + (kills >= BOSSES.length && hunt.i === BOSSES.length - 1 ? " " + L(HT.all) : "");
        panel.querySelector(".fx-count").textContent = L(HT.count) + " : " + kills + " / " + BOSSES.length;
        huntNext(hunt.i + 1 < BOSSES.length ? L(HT.next) : L(HT.retry), hunt.i + 1 < BOSSES.length ? hunt.i + 1 : hunt.i);
      }
    } else {
      hunt.hp--; snd("miss"); shake();
      msg.textContent = L(HT.miss); msg.className = "fx-msg bad";
      if (hunt.hp <= 0) {
        hunt.over = true;
        msg.innerHTML = '<span class="fx-big dead">' + L(HT.dead) + "</span>";
        huntNext(L(HT.retry), hunt.i);
      }
    }
    huntPaint();
  }
  function huntNext(label, i) {
    var b = panel.querySelector(".fx-next");
    b.textContent = label; b.hidden = false;
    b.onclick = function () { cancelAnimationFrame(hunt.raf); huntOpen(i); };
  }
  document.addEventListener("keydown", function (e) {
    if (hunt && panel && (e.key === " " || e.key === "Enter")) { e.preventDefault(); huntStrike(); }
  });

  // =====================================================================
  // Mini-jeu de God of War III : le combat contre les dieux
  // Un symbole s'affiche : appuyer sur le bon bouton avant la fin du temps.
  // =====================================================================
  var GODS = [
    { n: { fr: "Poséidon", en: "Poseidon", es: "Poseidón" }, hp: 4, time: 2.2 },
    { n: { fr: "Hadès", en: "Hades", es: "Hades" }, hp: 4, time: 1.9 },
    { n: { fr: "Hélios", en: "Helios", es: "Helios" }, hp: 5, time: 1.7 },
    { n: { fr: "Hermès", en: "Hermes", es: "Hermes" }, hp: 5, time: 1.5 },
    { n: { fr: "Héraclès", en: "Hercules", es: "Hércules" }, hp: 6, time: 1.3 },
    { n: { fr: "Zeus", en: "Zeus", es: "Zeus" }, hp: 7, time: 1.15 }
  ];
  var SYMS = [{ k: "tri", g: "△" }, { k: "cir", g: "○" }, { k: "sq", g: "□" }, { k: "x", g: "✕" }];
  var GT = {
    title: { fr: "Combat contre les dieux", en: "Fight the gods", es: "Combate contra los dioses" },
    help: { fr: "Appuie sur le bouton affiché avant la fin du temps.", en: "Press the button shown before time runs out.", es: "Pulsa el botón que aparece antes de que se acabe el tiempo." },
    start: { fr: "⚔ Combattre", en: "⚔ Fight", es: "⚔ Luchar" },
    hit: { fr: "Coup puissant !", en: "Mighty blow!", es: "¡Golpe poderoso!" },
    miss: { fr: "Trop lent… le dieu riposte !", en: "Too slow… the god strikes back!", es: "Demasiado lento… ¡el dios contraataca!" },
    wrong: { fr: "Mauvais bouton… le dieu riposte !", en: "Wrong button… the god strikes back!", es: "Botón equivocado… ¡el dios contraataca!" },
    win: { fr: "est vaincu !", en: "is defeated!", es: "ha sido derrotado!" },
    zeus: { fr: "Zeus est vaincu. L’Olympe est tombé !", en: "Zeus is defeated. Olympus has fallen!", es: "Zeus ha sido derrotado. ¡El Olimpo ha caído!" },
    dead: { fr: "Kratos est tombé… mais il revient toujours.", en: "Kratos has fallen… but he always comes back.", es: "Kratos ha caído… pero siempre vuelve." },
    next: { fr: "Dieu suivant ›", en: "Next god ›", es: "Siguiente dios ›" },
    retry: { fr: "Réessayer", en: "Try again", es: "Reintentar" },
    count: { fr: "Dieux vaincus", en: "Gods defeated", es: "Dioses derrotados" }
  };
  var fight = null;
  function fightOpen(i) {
    var won = load("fx-gods", 0);
    if (i === undefined) i = Math.min(won, GODS.length - 1);
    var G = GODS[i];
    var hearts = owned("toison") ? 4 : 3;
    fight = { i: i, hp: G.hp, kr: hearts, maxKr: hearts, dmg: owned("arc") ? 2 : 1, time: G.time + (owned("bottes") ? .45 : 0), want: null, t0: 0, raf: 0, over: false, started: false };
    panel.className = "fx-panel fx-ui fx-gods";
    panel.innerHTML = closeBtn() +
      '<p class="fx-title">⚡ ' + L(GT.title) + "</p>" +
      '<p class="fx-foe">' + L(G.n) + '</p><div class="gods-hp"><span></span></div>' +
      '<p class="fx-help">' + L(GT.help) + "</p>" +
      '<div class="gods-prompt"><span class="gods-sym">⚔</span></div><div class="gods-time"><span></span></div>' +
      '<div class="gods-pad">' + SYMS.map(function (s) { return '<button type="button" class="gods-key k-' + s.k + '" data-k="' + s.k + '">' + s.g + "</button>"; }).join("") + "</div>" +
      '<p class="fx-msg" role="status" aria-live="polite"></p>' +
      '<div class="fx-foot"><span class="fx-me"></span><span class="fx-count">' + L(GT.count) + " : " + won + " / " + GODS.length + "</span></div>" +
      '<button type="button" class="fx-next">' + L(GT.start) + "</button>" + shopButton();
    wireClose(); wireShop();
    panel.querySelectorAll(".gods-key").forEach(function (b) { b.addEventListener("click", function () { fightPress(b.dataset.k, b); }); });
    panel.querySelector(".fx-next").onclick = function () { this.hidden = true; fight.started = true; fightPrompt(); };
    fightPaint();
    gameStop = function () { if (fight) cancelAnimationFrame(fight.raf); fight = null; };
  }
  function fightPaint() {
    if (!panel || !fight) return;
    panel.querySelector(".gods-hp span").style.width = (Math.max(0, fight.hp) / GODS[fight.i].hp * 100) + "%";
    panel.querySelector(".fx-me").innerHTML = "Kratos " + pips(fight.kr, fight.maxKr, "❤️", '<span class="off">❤️</span>');
  }
  function fightPrompt() {
    if (!fight || fight.over) return;
    fight.want = pick(SYMS);
    var s = panel.querySelector(".gods-sym");
    s.textContent = fight.want.g; s.className = "gods-sym k-" + fight.want.k;
    s.parentNode.classList.remove("pop"); void s.offsetWidth; s.parentNode.classList.add("pop");
    fight.t0 = performance.now();
    cancelAnimationFrame(fight.raf);
    (function tick(now) {
      if (!fight || fight.over || !panel) return;
      var left = 1 - (now - fight.t0) / (fight.time * 1000);
      panel.querySelector(".gods-time span").style.width = Math.max(0, left * 100) + "%";
      if (left <= 0) { fightMiss(GT.miss); return; }
      fight.raf = requestAnimationFrame(tick);
    })(fight.t0);
  }
  function fightPress(k, btn) {
    if (!fight || !fight.started || fight.over || !fight.want) return;
    cancelAnimationFrame(fight.raf);
    // le symbole est « consommé » : les clics en trop avant le symbole suivant sont ignorés
    var want = fight.want; fight.want = null;
    var msg = panel.querySelector(".fx-msg");
    if (k === want.k) {
      fight.hp -= fight.dmg; snd("hit");
      var r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 26, 4.5);
      msg.textContent = L(GT.hit); msg.className = "fx-msg good";
      fightPaint();
      if (fight.hp <= 0) {
        fight.over = true;
        var won = Math.max(load("fx-gods", 0), fight.i + 1);
        save("fx-gods", won);
        addPoints(150 * (fight.i + 1));
        snd("win");
        var last = fight.i === GODS.length - 1;
        msg.innerHTML = '<span class="fx-big win">' + (last ? L(GT.zeus) : L(GODS[fight.i].n) + " " + L(GT.win)) + "</span>";
        panel.querySelector(".fx-count").textContent = L(GT.count) + " : " + won + " / " + GODS.length;
        fightNext(last ? L(GT.retry) : L(GT.next), last ? fight.i : fight.i + 1);
        return;
      }
      setTimeout(fightPrompt, 350);
    } else fightMiss(GT.wrong);
  }
  function fightMiss(text) {
    if (!fight || fight.over) return;
    cancelAnimationFrame(fight.raf);
    fight.want = null;
    fight.kr--; snd("miss"); shake();
    var msg = panel.querySelector(".fx-msg");
    msg.textContent = L(text); msg.className = "fx-msg bad";
    fightPaint();
    if (fight.kr <= 0) {
      fight.over = true;
      msg.innerHTML = '<span class="fx-big dead">' + L(GT.dead) + "</span>";
      fightNext(L(GT.retry), fight.i);
      return;
    }
    setTimeout(fightPrompt, 600);
  }
  function fightNext(label, i) {
    var b = panel.querySelector(".fx-next");
    b.textContent = label; b.hidden = false;
    b.onclick = function () { fightOpen(i); };
  }

  // =====================================================================
  // Slime Rancher : les slimes de l'en-tête (ils suivent la souris des yeux) et le ranch
  // =====================================================================
  var SLIMES = [
    { id: "rose", n: { fr: "Slime rose", en: "Pink slime", es: "Slime rosa" }, body: "#ff7ac8", light: "#ffd0ec", dark: "#d94fa3", eats: "all", plort: 5 },
    { id: "roche", n: { fr: "Slime roche", en: "Rock slime", es: "Slime roca" }, body: "#7f9bb8", light: "#d0dde9", dark: "#4f6680", eats: "veg", plort: 10, deco: "rock" },
    { id: "tigre", n: { fr: "Slime tigré", en: "Tabby slime", es: "Slime atigrado" }, body: "#ff9f43", light: "#ffd8a8", dark: "#b8621a", eats: "meat", plort: 15, deco: "tabby" },
    { id: "miel", n: { fr: "Slime miel", en: "Honey slime", es: "Slime miel" }, body: "#ffc94a", light: "#fff0c2", dark: "#c98d0a", eats: "fruit", plort: 25, deco: "honey" }
  ];
  var PHOSPHO = { id: "phospho", n: { fr: "Slime phosphorescent", en: "Phosphor slime", es: "Slime fosforescente" }, body: "#7af5ff", light: "#e6feff", dark: "#1fb3c4", eats: "fruit", plort: 30, deco: "glow" };
  var BOUM = { id: "boum", n: { fr: "Slime boum", en: "Boom slime", es: "Slime bum" }, body: "#ff6a4a", light: "#ffc9bb", dark: "#6a1408", eats: "meat", plort: 45, deco: "boom" };
  function ranchSlimes() { return SLIMES.concat(owned("phospho") ? [PHOSPHO] : [], owned("boum") ? [BOUM] : []); }
  function plortValue(t) { return t.plort * (owned("marche") ? 2 : 1); }
  var LARGO = { id: "largo", body: "#ff7ac8", light: "#ffd0ec", dark: "#4f6680", deco: "rock", plort: 40 };
  var GOLD = { id: "or", body: "#ffd34d", light: "#fff6c9", dark: "#d4a017", plort: 100 };
  var FOODS = [
    { k: "veg", g: "🥕", n: { fr: "Légume", en: "Veggie", es: "Verdura" } },
    { k: "fruit", g: "🍓", n: { fr: "Fruit", en: "Fruit", es: "Fruta" } },
    { k: "meat", g: "🐔", n: { fr: "Viande", en: "Meat", es: "Carne" } }
  ];
  function slimeSvg(t) {
    var deco = "";
    if (t.deco === "rock") deco = '<path d="M14 15 L17 4 L23 12 L29 1 L34 11 L41 3 L44 13 L48 9 L47 19 Z" fill="' + t.dark + '"/>';
    if (t.deco === "tabby") deco = '<path d="M11 18 L9 3 L23 10 Z M49 18 L51 3 L37 10 Z" fill="' + t.body + '"/><path d="M26 8 L27 15 M34 8 L33 15 M30 7 L30 14" stroke="' + t.dark + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (t.deco === "honey") deco = '<path d="M18 9 Q18 16 21 16 Q24 16 23 9 Z M38 8 Q37 13 40 13 Q43 13 42 8 Z" fill="' + t.dark + '" opacity=".8"/>';
    if (t.deco === "glow") deco = '<circle cx="14" cy="12" r="2" fill="#fff"/><circle cx="46" cy="16" r="1.6" fill="#fff"/><circle cx="40" cy="8" r="1.2" fill="#fff"/>';
    if (t.deco === "boom") deco = '<path d="M14 22 L20 26 L16 32 M46 22 L40 27 L45 33 M28 10 L31 16 L27 19" fill="none" stroke="' + t.dark + '" stroke-width="2" stroke-linecap="round"/>';
    var crown = t.id === "or" ? '<path d="M20 8 L22 1 L26 6 L30 0 L34 6 L38 1 L40 8 Z" fill="#fff6c9" stroke="#d4a017" stroke-width="1"/>' : "";
    return '<svg viewBox="0 0 60 50" aria-hidden="true"><path d="M6 46 C2 30 12 6 30 6 C48 6 58 30 54 46 Z" fill="' + t.body + '"/>' + deco + crown +
      '<ellipse cx="20" cy="17" rx="6" ry="3" fill="' + t.light + '" opacity=".8"/>' +
      '<ellipse cx="22" cy="28" rx="4" ry="5" fill="#fff" opacity=".35"/><ellipse cx="38" cy="28" rx="4" ry="5" fill="#fff" opacity=".35"/>' +
      '<g class="sl-eyes"><ellipse cx="22" cy="28" rx="3.2" ry="4.4" fill="#2a1a2e"/><ellipse cx="38" cy="28" rx="3.2" ry="4.4" fill="#2a1a2e"/>' +
      '<circle cx="23" cy="26.5" r="1.2" fill="#fff"/><circle cx="39" cy="26.5" r="1.2" fill="#fff"/></g>' +
      '<path d="M25 35 Q30 40 35 35" fill="none" stroke="#2a1a2e" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  var slimeField = null, goldTimer = 0;
  function addHeroSlime(t, left, big) {
    var d = el("button", "sl-slime" + (big ? " sl-big" : "") + (t.deco === "glow" ? " sl-glow" : ""), slimeSvg(t));
    d.type = "button";
    d.setAttribute("aria-label", t.n ? L(t.n) : "slime");
    d.style.left = left + "%";
    d.style.animationDelay = (Math.random() * 1.2).toFixed(2) + "s";
    d.addEventListener("click", function (e) {
      d.classList.remove("squish"); void d.offsetWidth; d.classList.add("squish");
      var r = d.getBoundingClientRect();
      flyTo(r.left + r.width / 2, r.top, "plort", function () { addPoints(plortValue(t)); snd("coin"); });
    });
    slimeField.appendChild(d);
    return d;
  }
  function startSlimes() {
    var hero = document.querySelector(".hero");
    if (!hero || slimeField) return;
    slimeField = el("div", "sl-field");
    hero.insertBefore(slimeField, hero.firstChild);
    [58, 68, 78, 88].forEach(function (left, i) { addHeroSlime(SLIMES[i], left); });
    if (load("fx-largo", false)) addHeroSlime(LARGO, 46, true);
    if (owned("phospho")) addHeroSlime(PHOSPHO, 36);
    if (owned("boum")) addHeroSlime(BOUM, 26);
    if (!calm) goldTimer = setTimeout(goldSlime, rnd(12000, 20000));
  }
  function stopSlimes() { clearTimeout(goldTimer); if (slimeField) { slimeField.remove(); slimeField = null; } }
  // Un slime doré traverse l'en-tête de temps en temps : vite, il faut l'attraper !
  function goldSlime() {
    if (!slimeField || theme() !== "slime") return;
    var g = addHeroSlime(GOLD, -10);
    g.classList.add("sl-gold");
    g.addEventListener("click", function () {
      var r = g.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 40, 5);
      snd("win");
      bubble({ fr: "✨ Slime doré attrapé ! +100", en: "✨ Gold slime caught! +100", es: "✨ ¡Slime dorado atrapado! +100" }[html.lang]);
      setTimeout(function () { g.remove(); }, 300);
    });
    setTimeout(function () { g.remove(); }, 9000);
    goldTimer = setTimeout(goldSlime, rnd(25000, 40000));
  }
  // Les yeux des slimes suivent la souris
  if (finePointer) window.addEventListener("mousemove", function (e) {
    if (!slimeField) return;
    slimeField.querySelectorAll(".sl-slime").forEach(function (s) {
      var r = s.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      var d = Math.max(1, Math.sqrt(dx * dx + dy * dy)), k = Math.min(2.6, d / 60);
      var eyes = s.querySelector(".sl-eyes");
      if (eyes) eyes.setAttribute("transform", "translate(" + (dx / d * k).toFixed(2) + " " + (dy / d * k).toFixed(2) + ")");
    });
  }, { passive: true });

  var RT = {
    title: { fr: "Mon ranch", en: "My ranch", es: "Mi rancho" },
    help: { fr: "Choisis une nourriture, puis donne-la au bon slime : chacun a ses goûts ! Un slime content fait un plort.", en: "Pick some food, then give it to the right slime: each one has its own taste! A happy slime makes a plort.", es: "Elige una comida y dásela al slime correcto: ¡cada uno tiene sus gustos! Un slime contento hace un plort." },
    pickFirst: { fr: "Choisis d’abord une nourriture 🥕 🍓 🐔", en: "Pick some food first 🥕 🍓 🐔", es: "Primero elige una comida 🥕 🍓 🐔" },
    full: { fr: "Ce slime n’a plus faim, reviens dans un instant.", en: "This slime isn’t hungry anymore, come back in a moment.", es: "Este slime ya no tiene hambre, vuelve en un momento." },
    yum: { fr: "Miam ! Un plort de plus.", en: "Yum! One more plort.", es: "¡Ñam! Un plort más." },
    hungry: { fr: "A faim", en: "Hungry", es: "Hambre" },
    happy: { fr: "Content ♥", en: "Happy ♥", es: "Contento ♥" },
    eats: { all: { fr: "mange de tout", en: "eats everything", es: "come de todo" }, veg: { fr: "ne mange que des légumes 🥕", en: "only eats veggies 🥕", es: "solo come verduras 🥕" },
            fruit: { fr: "ne mange que des fruits 🍓", en: "only eats fruit 🍓", es: "solo come fruta 🍓" }, meat: { fr: "ne mange que de la viande 🐔", en: "only eats meat 🐔", es: "solo come carne 🐔" } },
    beurk: { fr: "Beurk ! ", en: "Yuck! ", es: "¡Puaj! " },
    plorts: { fr: "Plorts vendus", en: "Plorts sold", es: "Plorts vendidos" },
    largo: { fr: "Objectif : 250 Newbucks pour faire naître un Largo !", en: "Goal: 250 Newbucks to hatch a Largo!", es: "¡Objetivo: 250 Newbucks para que nazca un Largo!" }
  };
  var ranch = null;
  function ranchOpen() {
    ranch = { food: null, full: {} };
    var known = load("fx-diets", []);
    panel.className = "fx-panel fx-ui fx-ranch";
    panel.innerHTML = closeBtn() +
      '<p class="fx-title">🥕 ' + L(RT.title) + "</p>" +
      '<p class="fx-help">' + L(RT.help) + "</p>" +
      '<div class="ranch-foods">' + FOODS.map(function (f) { return '<button type="button" class="ranch-food" data-k="' + f.k + '"><span>' + f.g + "</span>" + L(f.n) + "</button>"; }).join("") + "</div>" +
      '<div class="ranch-pens">' + ranchSlimes().map(function (s) {
        return '<button type="button" class="ranch-pen" data-id="' + s.id + '"><span class="ranch-slime">' + slimeSvg(s) + "</span>" +
               '<span class="ranch-name">' + L(s.n) + '</span><span class="ranch-diet">' + (known.indexOf(s.id) > -1 ? L(RT.eats[s.eats]) : "?") + "</span>" +
               '<span class="ranch-state">' + L(RT.hungry) + "</span></button>";
      }).join("") + "</div>" +
      '<p class="fx-msg" role="status" aria-live="polite">' + (load("fx-largo", false) ? "" : L(RT.largo)) + "</p>" +
      '<div class="fx-foot"><span class="fx-count">' + L(RT.plorts) + " : " + load("fx-plorts", 0) + "</span></div>" + shopButton();
    wireClose(); wireShop();
    panel.querySelectorAll(".ranch-food").forEach(function (b) {
      b.addEventListener("click", function () {
        panel.querySelectorAll(".ranch-food").forEach(function (o) { o.classList.toggle("sel", o === b); });
        ranch.food = b.dataset.k;
      });
    });
    panel.querySelectorAll(".ranch-pen").forEach(function (b) { b.addEventListener("click", function () { ranchFeed(b); }); });
    gameStop = function () { ranch = null; };
  }
  function ranchFeed(pen) {
    if (!ranch) return;
    var s = ranchSlimes().filter(function (x) { return x.id === pen.dataset.id; })[0];
    var msg = panel.querySelector(".fx-msg");
    if (!ranch.food) { msg.textContent = L(RT.pickFirst); msg.className = "fx-msg"; return; }
    if (ranch.full[s.id] > Date.now()) { msg.textContent = L(RT.full); msg.className = "fx-msg"; return; }
    var known = load("fx-diets", []);
    if (known.indexOf(s.id) < 0) { known.push(s.id); save("fx-diets", known); }
    pen.querySelector(".ranch-diet").textContent = L(RT.eats[s.eats]);
    if (s.eats === "all" || s.eats === ranch.food) {
      ranch.full[s.id] = Date.now() + 4000;
      pen.classList.add("happy");
      pen.querySelector(".ranch-state").textContent = L(RT.happy);
      snd("hit");
      msg.textContent = L(RT.yum) + " +" + plortValue(s); msg.className = "fx-msg good";
      save("fx-plorts", load("fx-plorts", 0) + 1);
      panel.querySelector(".fx-count").textContent = L(RT.plorts) + " : " + load("fx-plorts", 0);
      var r = pen.getBoundingClientRect();
      flyTo(r.left + r.width / 2, r.top + 20, "plort", function () { addPoints(plortValue(s)); snd("coin"); });
      setTimeout(function () {
        if (!panel || !pen.isConnected) return;
        pen.classList.remove("happy");
        pen.querySelector(".ranch-state").textContent = L(RT.hungry);
      }, 4000);
    } else {
      snd("miss");
      pen.classList.remove("yuck"); void pen.offsetWidth; pen.classList.add("yuck");
      msg.textContent = L(RT.beurk) + L(s.n) + " " + L(RT.eats[s.eats]); msg.className = "fx-msg bad";
    }
  }

  // =====================================================================
  // Boutique : dépenser ses Échos de sang, Orbes rouges ou Newbucks
  // =====================================================================
  var SHOP = {
    lunesang: [
      { id: "fiole", g: "🧪", price: 1500, n: { fr: "Fiole de sang en plus", en: "Extra blood vial", es: "Vial de sangre extra" }, d: { fr: "La chasse commence avec 4 fioles au lieu de 3.", en: "The hunt starts with 4 vials instead of 3.", es: "La caza empieza con 4 viales en vez de 3." } },
      { id: "rune", g: "👁️", price: 2500, n: { fr: "Rune « Œil du chasseur »", en: "“Hunter’s Eye” rune", es: "Runa «Ojo del cazador»" }, d: { fr: "La zone rouge est plus large : plus facile de toucher.", en: "The red zone is wider: easier to hit.", es: "La zona roja es más ancha: más fácil acertar." } },
      { id: "lame", g: "⚔️", price: 4000, n: { fr: "Lame sacrée de Ludwig", en: "Ludwig’s Holy Blade", es: "Espada Sagrada de Ludwig" }, d: { fr: "Chaque attaque viscérale compte double.", en: "Every visceral attack counts double.", es: "Cada ataque visceral cuenta doble." } }
    ],
    gow3: [
      { id: "toison", g: "🐏", price: 300, n: { fr: "Toison d’or", en: "Golden Fleece", es: "Vellocino de oro" }, d: { fr: "Kratos a 4 cœurs au lieu de 3.", en: "Kratos has 4 hearts instead of 3.", es: "Kratos tiene 4 corazones en vez de 3." } },
      { id: "bottes", g: "👟", price: 500, n: { fr: "Bottes d’Hermès", en: "Boots of Hermes", es: "Botas de Hermes" }, d: { fr: "Plus de temps pour appuyer sur le bon bouton.", en: "More time to press the right button.", es: "Más tiempo para pulsar el botón correcto." } },
      { id: "arc", g: "🏹", price: 800, n: { fr: "Arc d’Apollon", en: "Bow of Apollo", es: "Arco de Apolo" }, d: { fr: "Chaque coup enlève 2 points de vie au dieu.", en: "Every blow takes 2 health points from the god.", es: "Cada golpe le quita 2 puntos de vida al dios." } }
    ],
    slime: [
      { id: "phospho", g: "✨", price: 150, n: { fr: "Slime phosphorescent", en: "Phosphor slime", es: "Slime fosforescente" }, d: { fr: "Un slime qui brille, pour le ranch et l’en-tête. Il aime les fruits.", en: "A glowing slime for the ranch and the header. It loves fruit.", es: "Un slime que brilla, para el rancho y la cabecera. Le encanta la fruta." } },
      { id: "boum", g: "💥", price: 300, n: { fr: "Slime boum", en: "Boom slime", es: "Slime bum" }, d: { fr: "Un slime explosif qui aime la viande. Ses plorts valent cher.", en: "An explosive slime that loves meat. Its plorts are worth a lot.", es: "Un slime explosivo al que le encanta la carne. Sus plorts valen mucho." } },
      { id: "marche", g: "📈", price: 500, n: { fr: "Bon plan au marché", en: "Market deal", es: "Chollo en el mercado" }, d: { fr: "Tous les plorts rapportent deux fois plus.", en: "All plorts are worth twice as much.", es: "Todos los plorts valen el doble." } }
    ]
  };
  var ST = {
    title: { fr: "Boutique", en: "Shop", es: "Tienda" },
    open: { fr: "🛒 Boutique", en: "🛒 Shop", es: "🛒 Tienda" },
    back: { fr: "‹ Retour au jeu", en: "‹ Back to the game", es: "‹ Volver al juego" },
    buy: { fr: "Acheter", en: "Buy", es: "Comprar" },
    owned: { fr: "✓ Acheté", en: "✓ Owned", es: "✓ Comprado" },
    poor: { fr: "Pas assez…", en: "Not enough…", es: "No alcanza…" },
    done: { fr: "Acheté : ", en: "Bought: ", es: "Comprado: " },
    help: { fr: "Gagne de l’argent en jouant, puis achète des améliorations. Elles restent pour toujours.", en: "Earn money by playing, then buy upgrades. They stay forever.", es: "Gana dinero jugando y compra mejoras. Se quedan para siempre." }
  };
  function owned(id) { return load("fx-shop", []).indexOf(id) > -1; }
  function shopButton() { return '<button type="button" class="fx-shop-btn">' + L(ST.open) + "</button>"; }
  function wireShop() { var b = panel.querySelector(".fx-shop-btn"); if (b) b.addEventListener("click", shopOpen); }
  function shopOpen() {
    if (gameStop) { gameStop(); gameStop = null; }
    var th = theme(), c = COUNTER[th], money = load(c.key, 0);
    panel.className = "fx-panel fx-ui fx-shop fx-shop-" + th;
    panel.innerHTML = closeBtn() +
      '<p class="fx-title">🛒 ' + L(ST.title) + "</p>" +
      '<p class="fx-help">' + L(ST.help) + "</p>" +
      '<p class="fx-wallet">' + c.icon + " <b>" + money.toLocaleString(html.lang || "fr") + "</b> " + L(c.label) + "</p>" +
      '<div class="shop-list">' + SHOP[th].map(function (it) {
        var has = owned(it.id), can = money >= it.price;
        return '<div class="shop-item' + (has ? " has" : "") + '"><span class="shop-ico">' + it.g + '</span><span class="shop-txt"><b>' + L(it.n) + "</b><small>" + L(it.d) + "</small></span>" +
               '<button type="button" class="shop-buy" data-id="' + it.id + '"' + (has || !can ? " disabled" : "") + ">" +
               (has ? L(ST.owned) : (can ? L(ST.buy) : L(ST.poor)) + "<br><small>" + c.icon + " " + it.price.toLocaleString(html.lang || "fr") + "</small>") + "</button></div>";
      }).join("") + "</div>" +
      '<p class="fx-msg" role="status" aria-live="polite"></p>' +
      '<button type="button" class="fx-next">' + L(ST.back) + "</button>";
    wireClose();
    panel.querySelector(".fx-next").addEventListener("click", function () { GAMES[th].open(); });
    panel.querySelectorAll(".shop-buy").forEach(function (b) {
      b.addEventListener("click", function () {
        var it = SHOP[th].filter(function (x) { return x.id === b.dataset.id; })[0];
        if (owned(it.id) || load(c.key, 0) < it.price) return;
        var list = load("fx-shop", []); list.push(it.id); save("fx-shop", list);
        addPoints(-it.price);
        snd("win");
        var r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 40, 5);
        if (th === "slime" && slimeField && (it.id === "phospho" || it.id === "boum")) addHeroSlime(it.id === "phospho" ? PHOSPHO : BOUM, it.id === "phospho" ? 36 : 26);
        shopOpen();
        panel.querySelector(".fx-msg").textContent = L(ST.done) + L(it.n) + " ✓";
        panel.querySelector(".fx-msg").className = "fx-msg good";
      });
    });
  }

  var GAMES = { lunesang: { open: function () { huntOpen(); } }, gow3: { open: function () { fightOpen(); } }, slime: { open: ranchOpen } };

  // =====================================================================
  // Clics sur la page : explosion de particules ; orbes rouges pour God of War III
  // =====================================================================
  document.addEventListener("click", function (e) {
    if (!isFx()) return;
    if (e.target.closest && e.target.closest(".fx-ui, .legend-overlay, .sl-slime")) return;
    burst(e.clientX, e.clientY, CFG[theme()].burst.n, CFG[theme()].burst.power);
    if (theme() === "gow3") {
      var n = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) (function (k) {
        setTimeout(function () { flyTo(e.clientX + rnd(-14, 14), e.clientY + rnd(-14, 14), "orb", function () { addPoints(1); snd("coin"); }); }, k * 70);
      })(i);
    }
  });
  // Un corbeau abattu (Palesang, voir legendes.js) rapporte des Échos de sang
  window.addEventListener("fx-points", function (e) {
    if (theme() !== "lunesang") return;
    flyTo(e.detail.x, e.detail.y, "echo", function () { addPoints(e.detail.n); snd("coin"); });
  });

  // =====================================================================
  // Tout en bas de la page : un grand événement
  // =====================================================================
  var END = {
    lunesang: { fr: "PROIE ABATTUE", en: "PREY SLAUGHTERED", es: "PRESA ABATIDA" },
    gow3: { fr: "L’OLYMPE EST TOMBÉ", en: "OLYMPUS HAS FALLEN", es: "EL OLIMPO HA CAÍDO" },
    slime: { fr: "Pluie de slimes !", en: "Slime rain!", es: "¡Lluvia de slimes!" }
  };
  var endShown = false;
  function checkEnd() {
    if (!isFx() || endShown) return;
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 30) return;
    endShown = true;
    var th = theme(), band = el("div", "fx-end fx-end-" + th, "<span>" + L(END[th]) + "</span>");
    document.body.appendChild(band);
    snd("win");
    if (th === "slime" && !calm) {
      for (var i = 0; i < 14; i++) (function (k) {
        setTimeout(function () {
          var s = el("span", "sl-rain", slimeSvg(SLIMES[k % SLIMES.length]));
          s.style.left = rnd(4, 92) + "vw";
          s.style.animationDuration = rnd(1.6, 2.6).toFixed(2) + "s";
          document.body.appendChild(s);
          setTimeout(function () { s.remove(); }, 3200);
        }, k * 110);
      })(i);
    }
    setTimeout(function () { band.classList.add("out"); }, 3000);
    setTimeout(function () { band.remove(); }, 3700);
  }
  window.addEventListener("scroll", function () {
    if (window.scrollY < 100) endShown = false;
    checkEnd();
  }, { passive: true });

  // Éclair de lumière quand on choisit le thème
  function sweep() {
    if (calm) return;
    var s = el("div", "fx-sweep fx-sweep-" + theme());
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1400);
  }

  // =====================================================================
  // Suivre le thème choisi (et la langue)
  // =====================================================================
  var was = null;
  function update() {
    var now = theme();
    if (now === was) return;
    var fxNow = FX.indexOf(now) > -1, fxWas = FX.indexOf(was) > -1;
    if (fxWas) { stopCanvas(); showQuotes(false); showUi(false); stopSlimes(); endShown = false; }
    if (QUOTE_ONLY.indexOf(was) > -1) showQuotes(false);
    if (QUOTE_ONLY.indexOf(now) > -1) showQuotes(true);
    if (fxNow) {
      startCanvas(); showQuotes(true); showUi(true);
      if (now === "slime") startSlimes();
      if (was !== null) sweep();   // pas d'éclair au chargement de la page
    }
    was = now;
  }
  new MutationObserver(update).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  new MutationObserver(function () {
    paintQuote();
    if (!isFx()) return; paintCounter(); paintMute();
    if (gameBtn) { gameBtn.title = L(GAME_NAME[theme()]); gameBtn.setAttribute("aria-label", gameBtn.title); }
    if (panel) openPanel();
  }).observe(html, { attributes: true, attributeFilter: ["lang"] });
  update();
})();
