// Thème Échecs Premium : effets spéciaux (en plus des couleurs or et argent)
//  - poussière d'or et d'argent qui flotte sur la page
//  - traînée d'étincelles derrière la souris
//  - explosion d'étincelles à chaque clic, et les pièces du classement qui tournent
//  - éclat de lumière qui traverse l'écran quand on choisit le thème
//  - cinématique « Promotion » quand on débloque le thème
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
  // 1) Mini-échiquier en or qui rejoue « la partie de l'Opéra »
  //    Paul Morphy contre le duc de Brunswick et le comte Isouard, Paris, 1858
  // =====================================================================
  var OPERA = ["e2e4","e7e5","g1f3","d7d6","d2d4","c8g4","d4e5","g4f3","d1f3","d6e5","f1c4","g8f6",
               "f3b3","d8e7","b1c3","c7c6","c1g5","b7b5","c3b5","c6b5","c4b5","b8d7","e1c1","a8d8",
               "d1d7","d8d7","h1d1","e7e6","b5d7","f6d7","b3b8","d7b8","d1d8"];
  var START = ["rnbqkbnr","pppppppp","........","........","........","........","PPPPPPPP","RNBQKBNR"];
  var GLYPH = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  var board = null, boardTimer = null;
  function sq(name) { return { f: name.charCodeAt(0) - 97, r: 8 - parseInt(name[1], 10) }; }
  function place(el, f, r) { el.style.left = (f * 12.5) + "%"; el.style.top = (r * 12.5) + "%"; }
  function buildBoard() {
    var wrap = document.createElement("div");
    wrap.className = "opera";
    wrap.setAttribute("aria-hidden", "true");
    var caption = { fr: "Morphy · Opéra de Paris, 1858", en: "Morphy · Paris Opera, 1858", es: "Morphy · Ópera de París, 1858" }[html.lang] || "Morphy · 1858";
    wrap.innerHTML = '<div class="opera-board"></div><p class="opera-cap">' + caption + '</p><p class="opera-mate"></p>';
    document.body.appendChild(wrap);
    return wrap;
  }
  function resetBoard() {
    var b = board.querySelector(".opera-board");
    b.innerHTML = "";
    board.pieces = {};
    board.querySelector(".opera-mate").textContent = "";
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
    if (board.ply >= OPERA.length) {
      board.classList.add("mate");
      board.querySelector(".opera-mate").textContent = { fr: "Échec et mat ♛", en: "Checkmate ♛", es: "Jaque mate ♛" }[html.lang] || "Checkmate";
      boardTimer = setTimeout(function () { resetBoard(); boardTimer = setTimeout(stepBoard, 1500); }, 4500);
      return;
    }
    var m = OPERA[board.ply++];
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

  function features(on) {
    if (on) {
      if (window.matchMedia("(min-width: 1180px)").matches) startBoard();
      showMute(true); countElo();
    } else { stopBoard(); showMute(false); resetElo(); mateShown = false; }
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
