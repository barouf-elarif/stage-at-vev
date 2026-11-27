// Thèmes légendaires (encore plus secrets que les thèmes secrets) : effets, sons et cinématiques
//  - Palesang (après Bloodborne) : brume, corbeaux, cloche, vague rouge au clic
//  - Le Mur (L'Attaque des Titans) : un géant se lève derrière le mur quand on fait défiler, vapeur, grondement
//  - God of War III (après God of War) : l'Olympe en feu, braises, éclairs et tonnerre
// Et le thème secret Slime Rancher : des slimes qui sautent dans l'en-tête, un plort à chaque clic
// La façon de les débloquer est dans theme.js.
(function () {
  var html = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function theme() { return html.dataset.theme || "auto"; }
  function t(o) { return o[html.lang] || o.fr; }

  // ---------- Sons (fabriqués par le navigateur, coupés avec le même réglage que le Premium) ----------
  var audio = null;
  function muted() { try { return localStorage.getItem("premium-mute") === "1"; } catch (e) { return false; } }
  function ac() {
    if (muted()) return null;
    if (!audio) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; audio = new A(); }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  // Cloche grave : plusieurs notes qui s'éteignent lentement
  function bell(delay) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    [110, 220, 277, 330, 440].forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      var v = [.22, .14, .06, .07, .04][i];
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + 3.2);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + 3.3);
    });
  }
  // Grondement : bruit grave filtré
  function rumble(dur) {
    var c = ac(); if (!c) return;
    dur = dur || 2;
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    var n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = buf; f.type = "lowpass"; f.frequency.value = 120;
    var t0 = c.currentTime;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.9, t0 + .3); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    n.connect(f).connect(g).connect(c.destination); n.start(t0);
  }

  // Tonnerre : un craquement sec puis un grondement
  function thunder() {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * .25), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var n = c.createBufferSource(), g = c.createGain();
    n.buffer = buf; g.gain.value = .6; n.connect(g).connect(c.destination); n.start();
    setTimeout(function () { rumble(2.6); }, 120);
  }
  // Petit « bloup » de slime
  function bloop() {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(260, t0); o.frequency.exponentialRampToValueAtTime(720, t0 + .12);
    g.gain.setValueAtTime(.25, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .18);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + .2);
  }

  // ---------- Cinématiques (appelées par theme.js au déblocage) ----------
  window.legendCinematic = function (id) {
    var o = document.createElement("div");
    o.className = "legend-overlay legend-" + id + (calm ? " legend-calm" : "");
    if (id === "lunesang") {
      o.innerHTML = '<div class="ls-moon-big"></div><p class="legend-word">' +
        t({ fr: "La chasse commence", en: "The hunt begins", es: "La caza comienza" }) + "</p>";
      bell(0); bell(1.1); bell(2.2);
    } else if (id === "gow3") {
      o.innerHTML =
        '<svg class="gw-bolt" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true"><path d="M60 0 L30 120 L55 120 L25 300 L80 100 L52 100 L75 0Z"/></svg>' +
        '<div class="gw-omega">Ω</div>' +
        '<p class="legend-word">' + t({ fr: "Le Fantôme de Sparte", en: "The Ghost of Sparta", es: "El Fantasma de Esparta" }) + "</p>";
      thunder();
      setTimeout(thunder, 1300);
    } else {
      o.innerHTML =
        '<div class="mw-half mw-left"></div><div class="mw-half mw-right"></div>' +
        '<svg class="mw-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M50 0 L47 18 L53 30 L46 47 L54 62 L48 80 L52 100"/><path d="M47 18 L36 24 L30 21"/><path d="M53 30 L66 36 L72 33"/>' +
        '<path d="M46 47 L33 55 L24 52"/><path d="M54 62 L68 70 L77 66"/></svg>' +
        '<p class="legend-word">' + t({ fr: "Le mur est tombé", en: "The wall has fallen", es: "El muro ha caído" }) + "</p>";
      rumble(3.2);
    }
    document.body.appendChild(o);
    o.addEventListener("click", function () { o.classList.add("legend-out"); });
    setTimeout(function () { o.classList.add("legend-out"); }, 3600);
    setTimeout(function () { o.remove(); }, 4400);
  };

  // ---------- Palesang : brume, corbeaux, vague rouge au clic ----------
  var fog = null, crowTimer = null;
  var CROW = '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M30 16 C24 6 12 4 2 10 C12 10 20 14 26 20 L30 18 L34 20 C40 14 48 10 58 10 C48 4 36 6 30 16Z" fill="#0a0508"/></svg>';
  function crow() {
    if (theme() !== "lunesang") return;
    var c = document.createElement("div");
    c.className = "ls-crow";
    c.style.top = (6 + Math.random() * 30) + "vh";
    c.style.animationDuration = (7 + Math.random() * 5) + "s";
    c.style.setProperty("--s", (0.6 + Math.random() * 0.8).toFixed(2));
    c.innerHTML = CROW;
    document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 13000);
    crowTimer = setTimeout(crow, 4000 + Math.random() * 6000);
  }
  function startMoon() {
    if (!fog) { fog = document.createElement("div"); fog.className = "ls-fog"; fog.setAttribute("aria-hidden", "true"); document.body.appendChild(fog); }
    if (!calm) crowTimer = setTimeout(crow, 1500);
  }
  function stopMoon() {
    clearTimeout(crowTimer);
    if (fog) { fog.remove(); fog = null; }
    document.querySelectorAll(".ls-crow").forEach(function (c) { c.remove(); });
  }

  // ---------- Le Mur : le géant derrière le mur ----------
  var GIANT = '<svg viewBox="0 0 400 300" aria-hidden="true">' +
    '<path d="M60 300 C70 220 120 200 150 190 C140 160 135 120 145 90 C155 50 180 30 200 30 C220 30 245 50 255 90 C265 120 260 160 250 190 C280 200 330 220 340 300Z" fill="#5a2a22"/>' +
    '<path d="M150 190 C175 205 225 205 250 190 M170 120 C180 150 220 150 230 120 M120 250 C150 235 170 240 190 260 M280 250 C250 235 230 240 210 260" fill="none" stroke="#8a3f30" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="178" cy="100" rx="11" ry="6" fill="#ffd166"/><ellipse cx="222" cy="100" rx="11" ry="6" fill="#ffd166"/>' +
    '<ellipse cx="178" cy="100" rx="4" ry="4" fill="#3a1208"/><ellipse cx="222" cy="100" rx="4" ry="4" fill="#3a1208"/></svg>';
  var giant = null, wallTicking = false;
  function placeGiant() {
    if (!giant) return;
    var y = Math.min(window.scrollY, 400);
    // au repos on voit le haut de sa tête au-dessus du mur ; en faisant défiler, il se lève et ses yeux apparaissent
    giant.firstChild.style.transform = "translate(-50%, " + Math.max(-14, 4 - y * 0.1) + "%)";
  }
  function onWallScroll() {
    if (wallTicking || !giant) return;
    wallTicking = true;
    requestAnimationFrame(function () { placeGiant(); wallTicking = false; });
  }
  function startWall() {
    var hero = document.querySelector(".hero");
    if (!hero || giant) return;
    giant = document.createElement("div");
    giant.className = "mw-giant";
    giant.innerHTML = '<div class="mw-body">' + GIANT + '<span class="mw-steam"></span></div>';
    hero.insertBefore(giant, hero.firstChild);
    placeGiant();
    window.addEventListener("scroll", onWallScroll, { passive: true });
  }
  function stopWall() {
    window.removeEventListener("scroll", onWallScroll);
    if (giant) { giant.remove(); giant = null; }
  }

  // ---------- God of War III : braises qui montent de l'Olympe en feu ----------
  var emberTimer = null;
  function ember() {
    if (theme() !== "gow3") return;
    var e = document.createElement("span");
    e.className = "gw-ember";
    e.style.left = (Math.random() * 100) + "vw";
    e.style.animationDuration = (5 + Math.random() * 5) + "s";
    e.style.setProperty("--dx", ((Math.random() - 0.5) * 120).toFixed(0) + "px");
    document.body.appendChild(e);
    setTimeout(function () { e.remove(); }, 10500);
    emberTimer = setTimeout(ember, 250 + Math.random() * 450);
  }
  function startGow() { if (!calm) ember(); }
  function stopGow() { clearTimeout(emberTimer); document.querySelectorAll(".gw-ember").forEach(function (e) { e.remove(); }); }

  // ---------- Slime Rancher : des slimes qui sautent dans l'en-tête ----------
  function slimeSvg(body, light) {
    return '<svg viewBox="0 0 60 50" aria-hidden="true"><path d="M6 46 C2 30 12 6 30 6 C48 6 58 30 54 46 Z" fill="' + body + '"/>' +
      '<ellipse cx="20" cy="17" rx="6" ry="3" fill="' + light + '" opacity=".8"/>' +
      '<ellipse cx="22" cy="28" rx="3.2" ry="4.4" fill="#2a1a2e"/><ellipse cx="38" cy="28" rx="3.2" ry="4.4" fill="#2a1a2e"/>' +
      '<circle cx="23" cy="26.5" r="1.2" fill="#fff"/><circle cx="39" cy="26.5" r="1.2" fill="#fff"/>' +
      '<path d="M25 35 Q30 40 35 35" fill="none" stroke="#2a1a2e" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  var slimes = null;
  function startSlime() {
    var hero = document.querySelector(".hero");
    if (!hero || slimes) return;
    slimes = document.createElement("div");
    slimes.className = "sl-field";
    slimes.setAttribute("aria-hidden", "true");
    [["#ff7ac8", "#ffd0ec", 62], ["#7ad0ff", "#d6f1ff", 76], ["#ffc94a", "#fff0c2", 88]].forEach(function (c, i) {
      var d = document.createElement("span");
      d.className = "sl-slime";
      d.style.left = c[2] + "%";
      d.style.animationDelay = (i * 0.35) + "s";
      d.innerHTML = slimeSvg(c[0], c[1]);
      slimes.appendChild(d);
    });
    hero.insertBefore(slimes, hero.firstChild);
  }
  function stopSlime() { if (slimes) { slimes.remove(); slimes = null; } }

  // ---------- Clics : vague rouge (Palesang) ou poussière de pierre (Le Mur) ----------
  document.addEventListener("click", function (e) {
    var th = theme();
    if (th !== "lunesang" && th !== "mur" && th !== "gow3" && th !== "slime") return;
    if (e.target.closest && e.target.closest(".legend-overlay")) return;
    var r = document.createElement("span");
    r.className = { lunesang: "ls-ripple", mur: "mw-dust", gow3: "gw-spark", slime: "sl-plort" }[th];
    if (th === "slime") bloop();
    r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 900);
  });

  // ---------- Suivre le thème choisi ----------
  var was = theme();
  function update() {
    var now = theme();
    if (now === "lunesang" && was !== "lunesang") { startMoon(); if (was !== "auto" || document.readyState === "complete") bell(0); }
    if (now !== "lunesang" && was === "lunesang") stopMoon();
    if (now === "mur" && was !== "mur") { startWall(); if (document.readyState === "complete") rumble(1.4); }
    if (now !== "mur" && was === "mur") stopWall();
    if (now === "gow3" && was !== "gow3") { startGow(); if (document.readyState === "complete") thunder(); }
    if (now !== "gow3" && was === "gow3") stopGow();
    if (now === "slime" && was !== "slime") startSlime();
    if (now !== "slime" && was === "slime") stopSlime();
    was = now;
  }
  new MutationObserver(update).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  if (theme() === "lunesang") startMoon();
  if (theme() === "mur") startWall();
  if (theme() === "gow3") startGow();
  if (theme() === "slime") startSlime();
})();
