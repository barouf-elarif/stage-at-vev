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

  // Suivre le thème choisi
  var was = isPremium();
  function update() {
    var now = isPremium();
    if (now) start(); else stop();
    if (now && !was) sweep();
    was = now;
  }
  new MutationObserver(update).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  update();
})();
