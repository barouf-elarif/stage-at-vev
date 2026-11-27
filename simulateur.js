// Simulateur de recharge : les mêmes étapes que mes tests de borne chez VEV
//  1. passer le badge (autorisation)   2. brancher (Type 2 en AC ou Combo CCS2 en DC)
//  3. démarrer et suivre la charge en direct (statut, puissance, énergie)   4. arrêter et libérer la borne
(function () {
  var root = document.getElementById("simulateur");
  if (!root) return;
  var html = document.documentElement;
  var $ = function (sel) { return root.querySelector(sel); };

  var BATTERY = 60;        // kWh
  var START_SOC = 20;      // %
  var PRICE = { ac: 0.35, dc: 0.59 };   // €/kWh, simple exemple

  var T = {
    fr: { idle: "Disponible", auth: "Autorisé", plugged: "Véhicule branché", charging: "En charge", full: "Batterie pleine", done: "Terminé, borne libérée",
          mBadge: "🪪 Badge accepté : la charge est autorisée. Branche maintenant le câble.",
          mPlug: { ac: "🔌 Type 2 branché : courant alternatif, jusqu’à 11 kW (limité par le chargeur de la voiture).",
                   dc: "⚡ Combo CCS2 branché : courant continu, jusqu’à 150 kW. C’est la charge rapide." },
          mStart: "▶ La charge démarre. Suis-la en direct sur la plateforme.",
          mFull: "🔋 Batterie pleine ! La borne s’arrête toute seule.",
          mTaper: "📉 Au-dessus de 80 %, la puissance baisse pour protéger la batterie.",
          ticket: function (e, d, c) { return "🧾 Ticket : " + e + " kWh en " + d + ", environ " + c + " € (prix d’exemple). La borne est libérée."; },
          restart: "🪪 Nouvelle charge", min: "min", h: "h" },
    en: { idle: "Available", auth: "Authorized", plugged: "Vehicle plugged in", charging: "Charging", full: "Battery full", done: "Finished, charger released",
          mBadge: "🪪 Badge accepted: charging is authorized. Now plug in the cable.",
          mPlug: { ac: "🔌 Type 2 plugged in: alternating current, up to 11 kW (limited by the car’s onboard charger).",
                   dc: "⚡ Combo CCS2 plugged in: direct current, up to 150 kW. This is fast charging." },
          mStart: "▶ Charging starts. Follow it live on the platform.",
          mFull: "🔋 Battery full! The charger stops by itself.",
          mTaper: "📉 Above 80%, power drops to protect the battery.",
          ticket: function (e, d, c) { return "🧾 Receipt: " + e + " kWh in " + d + ", about €" + c + " (example price). The charger is released."; },
          restart: "🪪 New charge", min: "min", h: "h" },
    es: { idle: "Disponible", auth: "Autorizado", plugged: "Vehículo conectado", charging: "Cargando", full: "Batería llena", done: "Terminado, cargador liberado",
          mBadge: "🪪 Tarjeta aceptada: la carga está autorizada. Ahora conecta el cable.",
          mPlug: { ac: "🔌 Tipo 2 conectado: corriente alterna, hasta 11 kW (limitado por el cargador del coche).",
                   dc: "⚡ Combo CCS2 conectado: corriente continua, hasta 150 kW. Es la carga rápida." },
          mStart: "▶ La carga empieza. Síguela en directo en la plataforma.",
          mFull: "🔋 ¡Batería llena! El cargador se detiene solo.",
          mTaper: "📉 Por encima del 80 %, la potencia baja para proteger la batería.",
          ticket: function (e, d, c) { return "🧾 Ticket: " + e + " kWh en " + d + ", unos " + c + " € (precio de ejemplo). El cargador queda libre."; },
          restart: "🪪 Nueva carga", min: "min", h: "h" }
  };
  function tr() { return T[html.lang] || T.fr; }

  var state, plug, soc, energy, minutes, power, timer, tapered, lastMsg;
  function reset() {
    clearInterval(timer);
    state = "idle"; plug = null; soc = START_SOC; energy = 0; minutes = 0; power = 0; tapered = false; lastMsg = "";
  }

  // Puissance selon la prise et le niveau de batterie
  function powerFor(s) {
    if (plug === "ac") return s < 98 ? 11 : 3;
    if (s < 50) return 150;
    if (s < 80) return 150 - (s - 50) / 30 * 90;     // 150 -> 60 kW
    return Math.max(8, 60 - (s - 80) / 20 * 52);    // 60 -> 8 kW
  }

  function fmtTime(m) {
    var t = tr();
    if (m < 60) return Math.round(m) + " " + t.min;
    return Math.floor(m / 60) + " " + t.h + " " + String(Math.round(m % 60)).padStart(2, "0");
  }

  // nombres avec une virgule en français et en espagnol
  function num(x, d) { var v = x.toFixed(d); return html.lang === "en" ? v : v.replace(".", ","); }

  function say(msg) { lastMsg = msg; $(".sim-msg").textContent = msg; }

  function render() {
    var t = tr();
    root.querySelector(".sim").dataset.state = state;
    root.querySelector(".sim").dataset.plug = plug || "";
    var label = { idle: t.idle, auth: t.auth, plugged: t.plugged, charging: t.charging, full: t.full, done: t.done }[state];
    $(".sim-status").textContent = label;
    $(".sim-power").textContent = (state === "charging" ? power.toFixed(0) : "0") + " kW";
    $(".sim-energy").textContent = num(energy, 1) + " kWh";
    $(".sim-soc").textContent = Math.floor(soc) + " %";
    $(".sim-time").textContent = fmtTime(minutes);
    $(".sim-bat").setAttribute("width", (56 * soc / 100).toFixed(1));
    $(".sim-screen-text").textContent =
      state === "idle" ? "--" : state === "auth" ? "OK" : state === "plugged" ? plug.toUpperCase() :
      state === "charging" ? power.toFixed(0) + "kW" : "✓";
    // étapes disponibles
    var can = {
      badge: state === "idle" || state === "done",
      plug: state === "auth",
      start: state === "plugged",
      stop: state === "charging" || state === "full"
    };
    root.querySelectorAll(".sim-btn").forEach(function (b) { b.disabled = !can[b.dataset.act]; });
    root.querySelectorAll(".sim-steps li").forEach(function (li) { li.classList.toggle("sim-current", !!can[li.dataset.step]); });
    var badge = root.querySelector('[data-act="badge"]');
    if (state === "done") { badge.dataset.restart = "1"; badge.setAttribute("data-label", t.restart); }
    else { delete badge.dataset.restart; }
  }

  function tick() {
    var speed = parseInt($(".sim-speed select").value, 10);   // minutes simulées par minute réelle
    var dtMin = speed * 0.1 / 60;                             // un tick = 0,1 s réelle
    power = powerFor(soc);
    var dE = power * dtMin / 60;
    energy += dE;
    soc = Math.min(100, START_SOC + energy / BATTERY * 100);
    minutes += dtMin;
    if (!tapered && soc >= 80 && plug === "dc") { tapered = true; say(tr().mTaper); }
    if (soc >= 100) { clearInterval(timer); state = "full"; power = 0; energy = BATTERY * (100 - START_SOC) / 100; say(tr().mFull); }
    render();
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest(".sim-btn");
    if (!b || b.disabled) return;
    var act = b.dataset.act, t = tr();
    if (act === "badge") {
      if (state === "done") reset();
      state = "auth"; say(t.mBadge);
    } else if (act === "plug") {
      plug = b.dataset.plug; state = "plugged"; say(t.mPlug[plug]);
    } else if (act === "start") {
      state = "charging"; say(t.mStart);
      clearInterval(timer); timer = setInterval(tick, 100);
    } else if (act === "stop") {
      clearInterval(timer);
      var cost = num(energy * PRICE[plug], 2);
      state = "done"; power = 0;
      say(t.ticket(num(energy, 1), fmtTime(minutes), cost));
    }
    render();
  });

  // Changement de langue : réécrire les textes
  new MutationObserver(function () { render(); say(""); }).observe(html, { attributes: true, attributeFilter: ["lang"] });

  reset();
  render();
})();
