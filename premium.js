// Thème Échecs Premium : effets spéciaux (en plus des couleurs or et argent)
//  - poussière d'or et d'argent qui flotte sur la page
//  - traînée d'étincelles derrière la souris
//  - explosion d'étincelles à chaque clic, et les pièces du classement qui tournent
//  - éclat de lumière qui traverse l'écran quand on choisit le thème
//  - cinématique « Promotion » quand on débloque le thème
//  - puzzles « Mat en 1 » et « Mat en 2 » (bouton ♞), citations de grands joueurs, curseur cavalier
(function () {
  var html = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var GOLD = ["#fff3c4", "#f3d77a", "#d4af37", "#c9a227"];
  var SILVER = ["#ffffff", "#e8eaed", "#c0c4c8"];

  var canvas = null, ctx = null, dust = [], sparks = [], running = false, raf = 0, w = 0, h = 0, dpr = 1;

  function isPremium() { return html.dataset.theme === "premium"; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeDust() {
    var n = Math.round(Math.min(70, (w * h) / 22000));
    dust = [];
    for (var i = 0; i < n; i++) {
      dust.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.12 + Math.random() * 0.35), vx: (Math.random() - 0.5) * 0.15,
        t: Math.random() * Math.PI * 2, tw: 0.02 + Math.random() * 0.04,
        c: Math.random() < 0.6 ? pick(GOLD) : pick(SILVER)
      });
    }
  }

  // Petite étoile à 4 branches
  function star(x, y, r, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2.2);
    ctx.quadraticCurveTo(x, y, x + r * 2.2, y);
    ctx.quadraticCurveTo(x, y, x, y + r * 2.2);
    ctx.quadraticCurveTo(x, y, x - r * 2.2, y);
    ctx.quadraticCurveTo(x, y, x, y - r * 2.2);
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowBlur = 6;
    dust.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.t += p.tw;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      var a = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(p.t));
      ctx.shadowColor = p.c;
      if (p.r > 1.7) star(p.x, p.y, p.r * 0.9, p.c, a);
      else { ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    });
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += s.g; s.vx *= 0.97; s.life -= 1;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.shadowColor = s.c;
      star(s.x, s.y, s.r * (s.life / s.max), s.c, Math.min(1, s.life / s.max * 1.4));
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  }

  function burst(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.6 + Math.random()) * power;
      var life = 35 + Math.random() * 30;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, g: 0.06,
                    r: 1.4 + Math.random() * 2.2, c: Math.random() < 0.65 ? pick(GOLD) : pick(SILVER),
                    life: life, max: life });
    }
  }

  function start() {
    if (running || calm) return;
    running = true;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "premium-fx";
      canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
    }
    document.body.appendChild(canvas);
    resize(); makeDust();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    sparks = [];
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  // Éclat de lumière qui traverse l'écran
  function sweep() {
    if (calm) return;
    var s = document.createElement("div");
    s.className = "premium-sweep";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1300);
  }

  // Cinématique de la promotion : le pion blanc devient une dame d'or
  window.premiumPromotion = function () {
    var o = document.createElement("div");
    o.className = "promo-overlay" + (calm ? " promo-calm" : "");
    var word = { fr: "Promotion", en: "Promotion", es: "Coronación" }[html.lang] || "Promotion";
    o.innerHTML = '<div class="promo-rays"></div><div class="promo-piece"><span class="promo-pawn">♙</span><span class="promo-queen">♛</span></div><p class="promo-word">' + word + "</p>";
    document.body.appendChild(o);
    if (!calm) setTimeout(function () { burst(w / 2, h / 2, 90, 7); }, 1150);
    setTimeout(function () { if (window.premiumChime) window.premiumChime(); }, 1150);
    o.addEventListener("click", function () { o.classList.add("promo-out"); });
    setTimeout(function () { o.classList.add("promo-out"); }, 3200);
    setTimeout(function () { o.remove(); }, 3900);
  };

  // Souris : traînée d'étincelles
  var last = 0;
  if (finePointer) window.addEventListener("mousemove", function (e) {
    if (!running) return;
    var now = performance.now();
    if (now - last < 28) return;
    last = now;
    var life = 22 + Math.random() * 14;
    sparks.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.6,
                  g: 0.03, r: 1 + Math.random() * 1.6, c: Math.random() < 0.7 ? pick(GOLD) : pick(SILVER),
                  life: life, max: life });
  }, { passive: true });

  // Clic : explosion d'étincelles ; une pièce du classement fait un tour sur elle-même
  document.addEventListener("click", function (e) {
    if (!running) return;
    var piece = e.target.closest && e.target.closest(".rank");
    burst(e.clientX, e.clientY, piece ? 34 : 14, piece ? 4.5 : 3);
    if (piece) {
      piece.classList.remove("premium-spin"); void piece.offsetWidth; piece.classList.add("premium-spin");
    }
  });

  window.addEventListener("resize", function () { if (running) { resize(); makeDust(); } });


  // =====================================================================
  // 1) Mini-échiquier en or qui rejoue trois parties célèbres, l'une après l'autre :
  //    - « la partie de l'Opéra » : Paul Morphy contre le duc de Brunswick et le comte Isouard, Paris, 1858
  //    - « l'Immortelle » : Adolf Anderssen contre Lionel Kieseritzky, Londres, 1851
  //    - « le mat de Légal » : Légal de Kermeur contre Saint-Brie, café de la Régence, Paris, 1750
  // =====================================================================
  var OPERA = ["e2e4","e7e5","g1f3","d7d6","d2d4","c8g4","d4e5","g4f3","d1f3","d6e5","f1c4","g8f6",
               "f3b3","d8e7","b1c3","c7c6","c1g5","b7b5","c3b5","c6b5","c4b5","b8d7","e1c1","a8d8",
               "d1d7","d8d7","h1d1","e7e6","b5d7","f6d7","b3b8","d7b8","d1d8"];
  var IMMORTAL = ["e2e4","e7e5","f2f4","e5f4","f1c4","d8h4","e1f1","b7b5","c4b5","g8f6","g1f3","h4h6",
                  "d2d3","f6h5","f3h4","h6g5","h4f5","c7c6","g2g4","h5f6","h1g1","c6b5","h2h4","g5g6",
                  "h4h5","g6g5","d1f3","f6g8","c1f4","g5f6","b1c3","f8c5","c3d5","f6b2","f4d6","c5g1",
                  "e4e5","b2a1","f1e2","b8a6","f5g7","e8d8","f3f6","g8f6","d6e7"];
  var LEGAL = ["e2e4","e7e5","g1f3","d7d6","f1c4","c8g4","b1c3","g7g6","f3e5","g4d1","c4f7","e8e7","c3d5"];
  var GAMES = [
    { moves: OPERA, cap: { fr: "Morphy · Opéra de Paris, 1858", en: "Morphy · Paris Opera, 1858", es: "Morphy · Ópera de París, 1858" } },
    { moves: IMMORTAL, cap: { fr: "Anderssen · « L’Immortelle », Londres, 1851", en: "Anderssen · “The Immortal Game”, London, 1851", es: "Anderssen · «La Inmortal», Londres, 1851" } },
    { moves: LEGAL, cap: { fr: "Légal · Le mat de Légal, Paris, 1750", en: "Légal · Légal’s Mate, Paris, 1750", es: "Légal · El mate de Légal, París, 1750" } }
  ];
  var gameIndex = 0;
  function game() { return GAMES[gameIndex]; }
  var START = ["rnbqkbnr","pppppppp","........","........","........","........","PPPPPPPP","RNBQKBNR"];
  var GLYPH = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  var board = null, boardTimer = null;
  function sq(name) { return { f: name.charCodeAt(0) - 97, r: 8 - parseInt(name[1], 10) }; }
  function place(el, f, r) { el.style.left = (f * 12.5) + "%"; el.style.top = (r * 12.5) + "%"; }
  function buildBoard() {
    var wrap = document.createElement("div");
    wrap.className = "opera";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<div class="opera-board"></div><p class="opera-cap"></p><p class="opera-mate"></p>';
    document.body.appendChild(wrap);
    return wrap;
  }
  function resetBoard() {
    var b = board.querySelector(".opera-board");
    b.innerHTML = "";
    board.pieces = {};
    board.querySelector(".opera-mate").textContent = "";
    board.querySelector(".opera-cap").textContent = game().cap[html.lang] || game().cap.en;
    board.classList.remove("mate");
    START.forEach(function (row, r) {
      row.split("").forEach(function (ch, f) {
        if (ch === ".") return;
        var p = document.createElement("span");
        p.className = "opera-piece " + (ch === ch.toUpperCase() ? "w" : "b");
        p.textContent = GLYPH[ch];
        place(p, f, r);
        b.appendChild(p);
        board.pieces[f + "," + r] = p;
      });
    });
    board.ply = 0;
  }
  function move(from, to) {
    var a = sq(from), z = sq(to), P = board.pieces;
    var piece = P[a.f + "," + a.r], victim = P[z.f + "," + z.r];
    if (!piece) return;
    if (victim) { victim.classList.add("taken"); setTimeout(function () { victim.remove(); }, 400); }
    delete P[a.f + "," + a.r];
    P[z.f + "," + z.r] = piece;
    place(piece, z.f, z.r);
    // Grand roque : la tour a1 va en d1
    if (from === "e1" && to === "c1") { var rook = P["0,7"]; delete P["0,7"]; P["3,7"] = rook; place(rook, 3, 7); }
  }
  function stepBoard() {
    if (!board) return;
    if (board.ply >= game().moves.length) {
      board.classList.add("mate");
      board.querySelector(".opera-mate").textContent = { fr: "Échec et mat ♛", en: "Checkmate ♛", es: "Jaque mate ♛" }[html.lang] || "Checkmate";
      // partie suivante
      boardTimer = setTimeout(function () { gameIndex = (gameIndex + 1) % GAMES.length; resetBoard(); boardTimer = setTimeout(stepBoard, 1500); }, 4500);
      return;
    }
    var m = game().moves[board.ply++];
    move(m.slice(0, 2), m.slice(2, 4));
    boardTimer = setTimeout(stepBoard, 1500);
  }
  function startBoard() {
    if (board) return;
    board = buildBoard();
    resetBoard();
    boardTimer = setTimeout(stepBoard, calm ? 3000 : 1200);
  }
  function stopBoard() {
    clearTimeout(boardTimer);
    if (board) { board.remove(); board = null; }
  }

  // =====================================================================
  // 2) Sons : une pièce posée à chaque clic, un carillon d'or à la promotion
  //    (sons fabriqués par le navigateur, aucun fichier ; bouton 🔊 / 🔇 en bas à droite)
  // =====================================================================
  var audio = null, muteBtn = null;
  function muted() { try { return localStorage.getItem("premium-mute") === "1"; } catch (e) { return false; } }
  function ac() {
    if (!audio) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; audio = new A(); }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  function clack() {
    if (muted()) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime;
    // petit « toc » de bois : une note grave très courte + un bruit sec
    var o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
    g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + .13);
    var len = Math.floor(c.sampleRate * .03), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var n = c.createBufferSource(), ng = c.createGain();
    n.buffer = buf; ng.gain.value = .25; n.connect(ng).connect(c.destination); n.start(t);
  }
  function chime() {
    if (muted()) return;
    var c = ac(); if (!c) return;
    [880, 1108.7, 1318.5, 1760].forEach(function (f, i) {
      var t = c.currentTime + i * .12, o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + 1.4);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.5);
    });
  }
  window.premiumChime = chime;
  function showMute(on) {
    if (on && !muteBtn) {
      muteBtn = document.createElement("button");
      muteBtn.type = "button"; muteBtn.className = "premium-mute";
      var paint = function () {
        muteBtn.textContent = muted() ? "🔇" : "🔊";
        muteBtn.title = muted() ? ({ fr: "Activer les sons", en: "Turn sounds on", es: "Activar sonidos" }[html.lang] || "Sound on")
                                : ({ fr: "Couper les sons", en: "Mute sounds", es: "Silenciar" }[html.lang] || "Mute");
      };
      muteBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        try { localStorage.setItem("premium-mute", muted() ? "0" : "1"); } catch (err) {}
        paint();
      });
      paint();
      document.body.appendChild(muteBtn);
    } else if (!on && muteBtn) { muteBtn.remove(); muteBtn = null; }
  }
  document.addEventListener("click", function (e) {
    if (!isPremium() || (muteBtn && e.target === muteBtn)) return;
    clack();
  });

  // =====================================================================
  // 3) Titre de Grand Maître : l'Elo monte en or ; tout en bas, le roi tombe : échec et mat
  // =====================================================================
  var elo = document.querySelector(".stat-value"), eloText = elo ? elo.textContent : "", eloRaf = 0;
  function countElo() {
    if (!elo) return;
    var t0 = performance.now(), dur = calm ? 1 : 1600;
    elo.classList.add("gm-elo");
    cancelAnimationFrame(eloRaf);
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      elo.textContent = Math.round(680 * e) + " – " + Math.round(710 * e);
      if (k < 1) eloRaf = requestAnimationFrame(tick); else elo.textContent = eloText;
    })(t0);
    setTimeout(function () { if (isPremium()) { cancelAnimationFrame(eloRaf); elo.textContent = eloText; } }, dur + 150);   // valeur finale assurée
    if (!elo.parentNode.querySelector(".gm-badge")) {
      var badge = document.createElement("span");
      badge.className = "gm-badge";
      badge.innerHTML = '♛ <span data-lang="fr">Grand Maître</span><span data-lang="en">Grandmaster</span><span data-lang="es">Gran Maestro</span>';
      elo.parentNode.insertBefore(badge, elo);
    }
  }
  function resetElo() {
    if (!elo) return;
    cancelAnimationFrame(eloRaf);
    elo.textContent = eloText;
    elo.classList.remove("gm-elo");
    var b = elo.parentNode.querySelector(".gm-badge"); if (b) b.remove();
  }
  var mateShown = false, mateEl = null;
  function checkMate() {
    if (!isPremium() || mateShown) return;
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 30) return;
    mateShown = true;
    mateEl = document.createElement("div");
    mateEl.className = "gm-mate";
    mateEl.innerHTML = '<span class="gm-king">♚</span><span class="gm-text">' +
      ({ fr: "Échec et mat !", en: "Checkmate!", es: "¡Jaque mate!" }[html.lang] || "Checkmate!") + "</span>";
    document.body.appendChild(mateEl);
    chime();
    setTimeout(function () { if (mateEl) { mateEl.classList.add("gm-out"); } }, 3200);
    setTimeout(function () { if (mateEl) { mateEl.remove(); mateEl = null; } }, 3900);
  }
  window.addEventListener("scroll", checkMate, { passive: true });
  window.addEventListener("scroll", function () {   // on peut le revoir en remontant tout en haut
    if (window.scrollY < 100) mateShown = false;
  }, { passive: true });

  // =====================================================================
  // 4) Puzzles d'échecs : bouton ♞ en bas à droite
  //    « Mat en 1 » : les Blancs matent en un coup
  //    « Mat en 2 » : les Blancs jouent, la réponse des Noirs (forcée) est jouée toute seule, puis les Blancs matent
  //    line = les coups de la solution : Blancs, Noirs, Blancs…
  // =====================================================================
  var PUZZLES = {
    1: [
      { // le mat du couloir
        board: ["......k.", ".....ppp", "........", "........", "........", "........", ".....PPP", "R.....K."],
        line: ["a1a8"], name: { fr: "Le mat du couloir", en: "Back-rank mate", es: "El mate del pasillo" } },
      { // le coup du berger
        board: ["r.bqkb.r", "pppp.ppp", "..n..n..", "....p..Q", "..B.P...", "........", "PPPP.PPP", "RNB.K.NR"],
        line: ["h5f7"], name: { fr: "Le coup du berger", en: "Scholar’s mate", es: "El mate del pastor" } },
      { // le mat à l'étouffée : le roi est enfermé par ses propres pièces
        board: ["......rk", "......pp", "........", "......N.", "........", "........", ".....PPP", "......K."],
        line: ["g5f7"], name: { fr: "Le mat à l’étouffée", en: "Smothered mate", es: "El mate de la coz" } },
      { // la dame soutenue par le fou
        board: [".......k", ".....ppp", "........", ".......Q", "........", "...B....", ".....PPP", "......K."],
        line: ["h5h7"], name: { fr: "La dame soutenue par le fou", en: "Queen backed by the bishop", es: "La dama apoyada por el alfil" } },
      { // finale roi et tour
        board: ["k.......", "........", ".K......", "........", "........", "........", "........", ".......R"],
        line: ["h1h8"], name: { fr: "Finale roi et tour", en: "King and rook endgame", es: "Final de rey y torre" } }
    ],
    2: [
      { // la dame se sacrifie pour attirer la dame noire, puis la tour mate sur la dernière rangée
        board: ["...r..k.", "..q..ppp", "........", "........", "...Q....", "........", ".....PPP", "...R..K."],
        line: ["d4d8", "c7d8", "d1d8"], name: { fr: "Le sacrifice de la dame", en: "The queen sacrifice", es: "El sacrificio de la dama" } },
      { // le mat de Philidor : sacrifice en g8, puis mat à l'étouffée
        board: ["....r..k", "......pp", ".......N", "...Q....", "........", "........", ".....PPP", "......K."],
        line: ["d5g8", "e8g8", "h6f7"], name: { fr: "Le mat de Philidor", en: "Philidor’s mate", es: "El mate de Philidor" } },
      { // un coup calme du roi : le roi noir n'a plus qu'une case
        board: [".......k", "........", ".....K..", "........", "........", "........", "........", "......R."],
        line: ["f6f7", "h8h7", "g1h1"], name: { fr: "Le coup calme", en: "The quiet move", es: "La jugada tranquila" } },
      { // le mat de Boden : deux fous qui se croisent
        board: ["..kr....", "pp.n....", "..n.....", "........", ".....B..", ".....Q..", "....BPPP", "......K."],
        line: ["f3c6", "b7c6", "e2a6"], name: { fr: "Le mat de Boden", en: "Boden’s mate", es: "El mate de Boden" } }
    ]
  };
  var PT = {
    fr: { tab1: "Mat en 1", tab2: "Mat en 2", turn1: "Les Blancs jouent et font échec et mat en un coup.",
          turn2: "Les Blancs jouent et font échec et mat en deux coups. La réponse des Noirs se joue toute seule.",
          pick: "Clique sur une pièce blanche, puis sur sa case d’arrivée.", wrong: "Pas tout à fait… cherche encore !",
          reply: "Bien vu ! Les Noirs sont obligés de répondre… À toi de finir !", right: "Échec et mat ! ♛ Bravo !",
          next: "Puzzle suivant ›", solved: function (n, t) { return "Résolus : " + n + " / " + t; },
          all: "Tous les puzzles de cette série sont résolus ♛", open: "Puzzles d’échecs", close: "Fermer" },
    en: { tab1: "Mate in 1", tab2: "Mate in 2", turn1: "White to play and checkmate in one move.",
          turn2: "White to play and checkmate in two moves. Black’s reply is played automatically.",
          pick: "Click a white piece, then its destination square.", wrong: "Not quite… keep looking!",
          reply: "Well spotted! Black has to reply… Now finish it!", right: "Checkmate! ♛ Well done!",
          next: "Next puzzle ›", solved: function (n, t) { return "Solved: " + n + " / " + t; },
          all: "Every puzzle in this set is solved ♛", open: "Chess puzzles", close: "Close" },
    es: { tab1: "Mate en 1", tab2: "Mate en 2", turn1: "Juegan las blancas y dan jaque mate en una jugada.",
          turn2: "Juegan las blancas y dan jaque mate en dos jugadas. La respuesta de las negras se juega sola.",
          pick: "Haz clic en una pieza blanca y luego en su casilla de llegada.", wrong: "No del todo… ¡sigue buscando!",
          reply: "¡Bien visto! Las negras están obligadas a responder… ¡Ahora termina!", right: "¡Jaque mate! ♛ ¡Bravo!",
          next: "Siguiente puzzle ›", solved: function (n, t) { return "Resueltos: " + n + " / " + t; },
          all: "Todos los puzzles de esta serie están resueltos ♛", open: "Puzzles de ajedrez", close: "Cerrar" }
  };
  function pt() { return PT[html.lang] || PT.fr; }
  function storeKey(m) { return m === 2 ? "premium-puzzles2" : "premium-puzzles"; }
  function solvedList(m) { try { return JSON.parse(localStorage.getItem(storeKey(m)) || "[]"); } catch (e) { return []; } }
  function saveSolved(m, l) { try { localStorage.setItem(storeKey(m), JSON.stringify(l)); } catch (e) {} }
  var pzBtn = null, pzPanel = null, pzMode = 1, pzIndex = 0, pzSel = null, pzStep = 0, pzBusy = false, pzTimer = 0;

  function showPuzzleBtn(on) {
    if (on && !pzBtn) {
      pzBtn = document.createElement("button");
      pzBtn.type = "button"; pzBtn.className = "pz-btn"; pzBtn.textContent = "♞";
      pzBtn.title = pt().open; pzBtn.setAttribute("aria-label", pt().open);
      pzBtn.addEventListener("click", function (e) { e.stopPropagation(); pzPanel ? closePuzzle() : openPuzzle(); });
      document.body.appendChild(pzBtn);
    } else if (!on && pzBtn) { pzBtn.remove(); pzBtn = null; closePuzzle(); }
  }
  function firstUnsolved(m) {
    var done = solvedList(m);
    for (var i = 0; i < PUZZLES[m].length; i++) if (done.indexOf(i) < 0) return i;
    return 0;
  }
  function openPuzzle() {
    // la série « Mat en 2 » s'ouvre directement quand tous les « Mat en 1 » sont résolus
    pzMode = solvedList(1).length >= PUZZLES[1].length && solvedList(2).length < PUZZLES[2].length ? 2 : 1;
    pzIndex = firstUnsolved(pzMode);
    pzPanel = document.createElement("div");
    pzPanel.className = "pz-panel";
    pzPanel.setAttribute("role", "dialog");
    pzPanel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.body.appendChild(pzPanel);
    pzBtn.setAttribute("aria-expanded", "true");
    drawPuzzle();
  }
  function closePuzzle() {
    clearTimeout(pzTimer);
    if (!pzPanel) return;
    pzPanel.remove(); pzPanel = null;
    if (pzBtn) pzBtn.setAttribute("aria-expanded", "false");
  }
  function drawPuzzle() {
    clearTimeout(pzTimer);
    var P = PUZZLES[pzMode][pzIndex], t = pt(), done = solvedList(pzMode);
    pzSel = null; pzStep = 0; pzBusy = false;
    var cells = "";
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
      var ch = P.board[r][f], name = String.fromCharCode(97 + f) + (8 - r);
      cells += '<button type="button" class="pz-sq ' + ((r + f) % 2 ? "dark" : "light") + '" data-sq="' + name + '"' +
               (ch !== "." ? ' data-color="' + (ch === ch.toUpperCase() ? "w" : "b") + '"' : "") + ' aria-label="' + name + '">' +
               (ch !== "." ? '<span class="pz-piece ' + (ch === ch.toUpperCase() ? "w" : "b") + '">' + GLYPH[ch] + "</span>" : "") + "</button>";
    }
    pzPanel.innerHTML =
      '<button type="button" class="pz-close" aria-label="' + t.close + '">×</button>' +
      '<div class="pz-tabs" role="tablist">' +
        '<button type="button" role="tab" data-mode="1" aria-selected="' + (pzMode === 1) + '">♞ ' + t.tab1 + "</button>" +
        '<button type="button" role="tab" data-mode="2" aria-selected="' + (pzMode === 2) + '">♞♞ ' + t.tab2 + "</button></div>" +
      '<p class="pz-title">' + (P.name[html.lang] || P.name.fr) + "</p>" +
      '<p class="pz-turn">' + (pzMode === 2 ? t.turn2 : t.turn1) + "</p>" +
      '<div class="pz-board">' + cells + "</div>" +
      '<p class="pz-msg" role="status" aria-live="polite">' + t.pick + "</p>" +
      '<div class="pz-foot"><span class="pz-count">' + t.solved(done.length, PUZZLES[pzMode].length) + '</span><button type="button" class="pz-next">' + t.next + "</button></div>";
    pzPanel.querySelector(".pz-close").addEventListener("click", closePuzzle);
    pzPanel.querySelector(".pz-next").addEventListener("click", function () { pzIndex = (pzIndex + 1) % PUZZLES[pzMode].length; drawPuzzle(); });
    pzPanel.querySelectorAll(".pz-tabs button").forEach(function (tb) {
      tb.addEventListener("click", function () {
        var m = +tb.dataset.mode;
        if (m === pzMode) return;
        pzMode = m; pzIndex = firstUnsolved(m); drawPuzzle();
      });
    });
    pzPanel.querySelector(".pz-board").addEventListener("click", onSquare);
  }
  // déplacer une pièce sur l'échiquier du puzzle (en prenant ce qu'il y a sur la case d'arrivée)
  function pzMove(from, to) {
    var a = pzPanel.querySelector('[data-sq="' + from + '"]'), z = pzPanel.querySelector('[data-sq="' + to + '"]');
    var piece = a.querySelector(".pz-piece");
    z.innerHTML = ""; z.appendChild(piece);
    z.dataset.color = a.dataset.color; delete a.dataset.color;
    pzPanel.querySelectorAll(".pz-sq.last").forEach(function (q) { q.classList.remove("last"); });
    a.classList.add("last"); z.classList.add("last");
    return z;
  }
  function onSquare(e) {
    var b = e.target.closest(".pz-sq");
    if (!b || pzBusy) return;
    var msg = pzPanel.querySelector(".pz-msg");
    if (b.dataset.color === "w") {   // choisir (ou changer) la pièce blanche
      if (pzSel) pzSel.classList.remove("sel");
      pzSel = b; b.classList.add("sel");
      return;
    }
    if (!pzSel) return;
    var P = PUZZLES[pzMode][pzIndex], mv = pzSel.dataset.sq + b.dataset.sq;
    pzSel.classList.remove("sel");
    if (mv !== P.line[pzStep]) {
      pzSel = null;
      msg.textContent = pt().wrong; msg.className = "pz-msg ko";
      var bd = pzPanel.querySelector(".pz-board");
      bd.classList.remove("shake"); void bd.offsetWidth; bd.classList.add("shake");
      return;
    }
    pzSel = null;
    var z = pzMove(mv.slice(0, 2), mv.slice(2, 4));
    clack();
    if (pzStep + 1 < P.line.length) {
      // bon premier coup : les Noirs répondent tout seuls
      pzBusy = true;
      msg.textContent = pt().reply; msg.className = "pz-msg ok";
      var reply = P.line[pzStep + 1], panel = pzPanel;
      pzTimer = setTimeout(function () {
        if (pzPanel !== panel) return;
        pzMove(reply.slice(0, 2), reply.slice(2, 4));
        clack();
        pzStep += 2; pzBusy = false;
      }, 900);
      return;
    }
    // échec et mat
    pzBusy = true;
    z.classList.add("mate");
    msg.textContent = pt().right; msg.className = "pz-msg ok";
    var done = solvedList(pzMode);
    if (done.indexOf(pzIndex) < 0) { done.push(pzIndex); saveSolved(pzMode, done); }
    pzPanel.querySelector(".pz-count").textContent = pt().solved(done.length, PUZZLES[pzMode].length);
    if (done.length === PUZZLES[pzMode].length) msg.textContent += " " + pt().all;
    var rc = z.getBoundingClientRect();
    if (running) burst(rc.left + rc.width / 2, rc.top + rc.height / 2, 60, 5);
    chime();
  }
  document.addEventListener("click", function (e) {   // clic en dehors : on ferme
    if (pzPanel && !pzPanel.contains(e.target) && e.target !== pzBtn) closePuzzle();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePuzzle(); });

  // =====================================================================
  // 5) Citations de grands joueurs dans l'en-tête, qui changent toutes les 7 secondes
  // =====================================================================
  var QUOTES = [
    { a: "François-André Philidor", fr: "Les pions sont l’âme des échecs.", en: "Pawns are the soul of chess.", es: "Los peones son el alma del ajedrez." },
    { a: "Emanuel Lasker", fr: "Quand tu trouves un bon coup, cherches-en un meilleur.", en: "When you see a good move, look for a better one.", es: "Cuando veas una buena jugada, busca una mejor." },
    { a: "Paul Morphy", fr: "Aide tes pièces, et elles t’aideront.", en: "Help your pieces so they can help you.", es: "Ayuda a tus piezas y ellas te ayudarán." },
    { a: "Siegbert Tarrasch", fr: "Les échecs, comme la musique et l’amour, ont le pouvoir de rendre les gens heureux.", en: "Chess, like love, like music, has the power to make men happy.", es: "El ajedrez, como el amor y la música, tiene el poder de hacer feliz a la gente." },
    { a: "Irving Chernev", fr: "Chaque maître des échecs a d’abord été un débutant.", en: "Every chess master was once a beginner.", es: "Todo maestro de ajedrez fue alguna vez un principiante." },
    { a: "Mikhaïl Tal", fr: "Il faut emmener ton adversaire dans une forêt sombre où 2 + 2 = 5, et où le chemin de sortie n’est assez large que pour un seul.", en: "You must take your opponent into a deep dark forest where 2 + 2 = 5, and the path leading out is only wide enough for one.", es: "Debes llevar a tu rival a un bosque oscuro donde 2 + 2 = 5, y donde el camino de salida solo es lo bastante ancho para uno." },
    { a: "Aron Nimzowitsch", fr: "La menace est plus forte que son exécution.", en: "The threat is stronger than the execution.", es: "La amenaza es más fuerte que su ejecución." },
    { a: "Wilhelm Steinitz", fr: "Le roi est une pièce qui se bat : utilise-le !", en: "The king is a fighting piece. Use it!", es: "El rey es una pieza que lucha: ¡úsalo!" },
    { a: "Garry Kasparov", fr: "Les échecs sont une torture mentale.", en: "Chess is mental torture.", es: "El ajedrez es una tortura mental." },
    { a: "Benjamin Franklin", fr: "La vie est une sorte de partie d’échecs.", en: "Life is a kind of chess.", es: "La vida es una especie de partida de ajedrez." }
  ];
  // La citation garde la hauteur de la plus longue déjà affichée : la page ne bouge plus quand elle change
  // (sinon un menu déroulant ouvert plus bas, comme « Voiture » du simulateur, se refermait tout seul)
  function holdHeight(q) {
    var h = q.offsetHeight;
    if (h > (q._h || 0)) { q._h = h; q.style.minHeight = h + "px"; }
  }
  // Ne pas changer la citation pendant qu'on utilise un menu ou un champ
  function busyForm() { var a = document.activeElement; return !!a && /^(SELECT|INPUT|TEXTAREA)$/.test(a.tagName); }
  window.addEventListener("resize", function () { var q = document.querySelector(".pq:not(.fx-quote)"); if (q) { q._h = 0; q.style.minHeight = ""; } });
  var quoteEl = null, quoteTimer = null, quoteI = 0;
  function paintQuote() {
    var q = QUOTES[quoteI];
    quoteEl.innerHTML = "« " + (q[html.lang] || q.fr) + " »<cite>— " + q.a + "</cite>";
    holdHeight(quoteEl);
  }
  function showQuotes(on) {
    var dates = document.querySelector(".hero .dates");
    if (on && !quoteEl && dates) {
      quoteEl = document.createElement("blockquote");
      quoteEl.className = "pq";
      quoteI = Math.floor(Math.random() * QUOTES.length);
      paintQuote();
      dates.parentNode.insertBefore(quoteEl, dates.nextSibling);
      if (!calm) quoteTimer = setInterval(function () {
        if (busyForm()) return;
        quoteEl.classList.add("pq-out");
        setTimeout(function () { if (!quoteEl) return; quoteI = (quoteI + 1) % QUOTES.length; paintQuote(); quoteEl.classList.remove("pq-out"); }, 500);
      }, 7000);
    } else if (!on && quoteEl) { clearInterval(quoteTimer); quoteEl.remove(); quoteEl = null; }
  }
  // changement de langue : réécrire le bouton, la citation et le puzzle ouvert
  new MutationObserver(function () {
    if (quoteEl) paintQuote();
    if (pzBtn) { pzBtn.title = pt().open; pzBtn.setAttribute("aria-label", pt().open); }
    if (pzPanel) drawPuzzle();
  }).observe(html, { attributes: true, attributeFilter: ["lang"] });

  function features(on) {
    if (on) {
      if (window.matchMedia("(min-width: 1180px)").matches) startBoard();
      showMute(true); countElo(); showPuzzleBtn(true); showQuotes(true);
    } else { stopBoard(); showMute(false); resetElo(); mateShown = false; showPuzzleBtn(false); showQuotes(false); }
  }
  window.matchMedia("(min-width: 1180px)").addEventListener("change", function (m) {
    if (!isPremium()) return;
    if (m.matches) startBoard(); else stopBoard();
  });

  // Suivre le thème choisi
  var was = isPremium();
  function update() {
    var now = isPremium();
    if (now) start(); else stop();
    if (now && !was) { sweep(); features(true); }
    if (!now && was) features(false);
    was = now;
  }
  new MutationObserver(update).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  update();
  if (isPremium()) features(true);   // page ouverte directement avec le thème Premium
})();
