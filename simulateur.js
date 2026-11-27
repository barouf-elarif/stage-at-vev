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
  var PRICE = 0.56;        // €/kWh à la borne
  // Puissances qu'on peut choisir selon la prise (kW)
  var POWERS = { ac: [3.7, 7.4, 11, 22], dc: [50, 100, 150, 350] };
  var DEFAULT_POWER = { ac: 11, dc: 150 };
  // Comparatif avec une voiture diesel (valeurs moyennes, estimations)
  var EV_CONSO = 16;       // kWh / 100 km
  var DIESEL_CONSO = 6;    // L / 100 km
  var DIESEL_PRICE = 1.70; // €/L
  var HOME_PRICE = 0.25;   // €/kWh, recharge à la maison
  var CO2_DIESEL = 2.65;   // kg de CO2 par litre de gazole brûlé
  var CO2_ELEC = 0.05;     // kg de CO2 par kWh (électricité française, très bas carbone)

  var T = {
    fr: { idle: "Disponible", auth: "Autorisé", plugged: "Véhicule branché", charging: "En charge", full: "Batterie pleine", done: "Terminé, borne libérée",
          mBadge: "🪪 Badge accepté : la charge est autorisée. Branche maintenant le câble.",
          mPlug: { ac: "🔌 Type 2 branché : courant alternatif, de 3,7 à 22 kW. Choisis la puissance de la borne.",
                   dc: "⚡ Combo CCS2 branché : courant continu, de 50 à 350 kW. C’est la charge rapide. Choisis la puissance." },
          mPower: function (p) { return "🎚️ Puissance de la borne réglée sur " + p + " kW."; },
          mStart: "▶ La charge démarre. Suis-la en direct sur la plateforme.",
          mFull: "🔋 Batterie pleine ! La borne s’arrête toute seule.",
          mTaper: "📉 Au-dessus de 80 %, la puissance baisse pour protéger la batterie.",
          ticket: function (e, d, c) { return "🧾 Ticket : " + e + " kWh en " + d + ", soit " + c + " € (0,56 €/kWh). La borne est libérée."; },
          save: function (km, g) { return " 🚗 " + km + " km d’autonomie : en diesel, ça aurait coûté " + g + " €."; },
          restart: "🪪 Nouvelle charge", min: "min", h: "h" },
    en: { idle: "Available", auth: "Authorized", plugged: "Vehicle plugged in", charging: "Charging", full: "Battery full", done: "Finished, charger released",
          mBadge: "🪪 Badge accepted: charging is authorized. Now plug in the cable.",
          mPlug: { ac: "🔌 Type 2 plugged in: alternating current, from 3.7 to 22 kW. Choose the charger’s power.",
                   dc: "⚡ Combo CCS2 plugged in: direct current, from 50 to 350 kW. This is fast charging. Choose the power." },
          mPower: function (p) { return "🎚️ Charger power set to " + p + " kW."; },
          mStart: "▶ Charging starts. Follow it live on the platform.",
          mFull: "🔋 Battery full! The charger stops by itself.",
          mTaper: "📉 Above 80%, power drops to protect the battery.",
          ticket: function (e, d, c) { return "🧾 Receipt: " + e + " kWh in " + d + ", that’s €" + c + " (€0.56/kWh). The charger is released."; },
          save: function (km, g) { return " 🚗 " + km + " km of range: with a diesel car, it would have cost €" + g + "."; },
          restart: "🪪 New charge", min: "min", h: "h" },
    es: { idle: "Disponible", auth: "Autorizado", plugged: "Vehículo conectado", charging: "Cargando", full: "Batería llena", done: "Terminado, cargador liberado",
          mBadge: "🪪 Tarjeta aceptada: la carga está autorizada. Ahora conecta el cable.",
          mPlug: { ac: "🔌 Tipo 2 conectado: corriente alterna, de 3,7 a 22 kW. Elige la potencia del cargador.",
                   dc: "⚡ Combo CCS2 conectado: corriente continua, de 50 a 350 kW. Es la carga rápida. Elige la potencia." },
          mPower: function (p) { return "🎚️ Potencia del cargador ajustada a " + p + " kW."; },
          mStart: "▶ La carga empieza. Síguela en directo en la plataforma.",
          mFull: "🔋 ¡Batería llena! El cargador se detiene solo.",
          mTaper: "📉 Por encima del 80 %, la potencia baja para proteger la batería.",
          ticket: function (e, d, c) { return "🧾 Ticket: " + e + " kWh en " + d + ", o sea " + c + " € (0,56 €/kWh). El cargador queda libre."; },
          save: function (km, g) { return " 🚗 " + km + " km de autonomía: con un coche diésel, habría costado " + g + " €."; },
          restart: "🪪 Nueva carga", min: "min", h: "h" }
  };
  function tr() { return T[html.lang] || T.fr; }

  var state, plug, soc, energy, minutes, power, maxPower, timer, tapered, lastMsg;
  function reset() {
    clearInterval(timer);
    state = "idle"; plug = null; soc = START_SOC; energy = 0; minutes = 0; power = 0; maxPower = 0; tapered = false; lastMsg = "";
    fillPowers();
  }

  // Liste des puissances selon la prise branchée
  function fillPowers() {
    var sel = $(".sim-power-select select");
    sel.innerHTML = "";
    if (!plug) { sel.innerHTML = "<option>—</option>"; return; }
    POWERS[plug].forEach(function (p) {
      var o = document.createElement("option");
      o.value = p; o.textContent = num(p, p % 1 ? 1 : 0) + " kW";
      if (p === DEFAULT_POWER[plug]) o.selected = true;
      sel.appendChild(o);
    });
    maxPower = DEFAULT_POWER[plug];
  }

  // Puissance selon la prise, la puissance choisie et le niveau de batterie
  function powerFor(s) {
    if (plug === "ac") return s < 98 ? maxPower : Math.min(maxPower, 3);
    var f;
    if (s < 50) f = 1;
    else if (s < 80) f = 1 - (s - 50) / 30 * 0.6;    // 100 % -> 40 %
    else f = 0.4 - (s - 80) / 20 * 0.35;             // 40 % -> 5 %
    return Math.max(5, maxPower * f);
  }

  // Comparatif avec le diesel pour l'énergie déjà chargée
  function compare(e) {
    var km = e / EV_CONSO * 100;
    var liters = km / 100 * DIESEL_CONSO;
    return {
      km: km, elec: e * PRICE, home: e * HOME_PRICE, diesel: liters * DIESEL_PRICE,
      co2Diesel: liters * CO2_DIESEL, co2Elec: e * CO2_ELEC
    };
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
    $(".sim-power-select select").disabled = !plug || state === "done";
    var c = compare(energy);
    $(".cmp-km").textContent = Math.round(c.km) + " km";
    $(".cmp-elec").textContent = num(c.elec, 2) + " €";
    $(".cmp-diesel").textContent = num(c.diesel, 2) + " €";
    $(".cmp-home").textContent = num(c.home, 2) + " €";
    $(".cmp-save").textContent = num(c.diesel - c.elec, 2) + " €";
    $(".cmp-co2").textContent = num(c.co2Diesel, 1) + " kg → " + num(c.co2Elec, 1) + " kg";
    var max = Math.max(c.diesel, 0.01);
    $(".cmp-bar-elec").style.width = (c.elec / max * 100) + "%";
    $(".cmp-bar-home").style.width = (c.home / max * 100) + "%";
    $(".cmp-bar-diesel").style.width = (c.diesel > 0 ? 100 : 0) + "%";
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
      plug = b.dataset.plug; state = "plugged"; fillPowers(); say(t.mPlug[plug]);
    } else if (act === "start") {
      state = "charging"; say(t.mStart);
      clearInterval(timer); timer = setInterval(tick, 100);
    } else if (act === "stop") {
      clearInterval(timer);
      var c = compare(energy);
      state = "done"; power = 0;
      say(t.ticket(num(energy, 1), fmtTime(minutes), num(c.elec, 2)) + t.save(Math.round(c.km), num(c.diesel, 2)));
    }
    render();
  });

  // Changement de puissance de la borne (possible aussi pendant la charge)
  $(".sim-power-select select").addEventListener("change", function (e) {
    maxPower = parseFloat(e.target.value);
    say(tr().mPower(num(maxPower, maxPower % 1 ? 1 : 0)));
    if (state === "charging") { power = powerFor(soc); }
    render();
  });

  // Économie par mois selon les kilomètres parcourus (indépendant de la charge en cours)
  function money(x) { return html.lang === "en" ? "€" + Math.round(x) : Math.round(x) + " €"; }
  function renderMonth() {
    var km = parseInt($(".cmp-month-km select").value, 10);
    var c = compare(km / 100 * EV_CONSO);
    $(".m-diesel").textContent = money(c.diesel);
    $(".m-elec").textContent = money(c.elec);
    $(".m-home").textContent = money(c.home);
    $(".m-save").textContent = money(c.diesel - c.elec);
    $(".m-save-year").textContent = money((c.diesel - c.elec) * 12);
    $(".m-save-home").textContent = money(c.diesel - c.home);
    $(".m-save-home-year").textContent = money((c.diesel - c.home) * 12);
  }
  $(".cmp-month-km select").addEventListener("change", renderMonth);

  // Changement de langue : réécrire les textes
  new MutationObserver(function () { var p = maxPower; fillPowers(); if (plug) { maxPower = p; $(".sim-power-select select").value = p; } render(); renderMonth(); say(""); }).observe(html, { attributes: true, attributeFilter: ["lang"] });

  reset();
  render();
  renderMonth();
})();
