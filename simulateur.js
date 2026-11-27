// Simulateur de recharge : les mêmes étapes que mes tests de borne chez VEV
//  1. passer le badge (autorisation)   2. brancher (Type 2 en AC ou Combo CCS2 en DC)
//  3. démarrer et suivre la charge en direct (statut, puissance, énergie)   4. arrêter et libérer la borne
// Réglages : la voiture (ou une voiture personnalisée), la batterie au départ, l'objectif, le prix à la borne.
// Comparatifs : diesel ou essence, coût aux 100 km, CO₂, par mois / an / 5 ans, temps de charge selon la puissance, trajets.
(function () {
  var root = document.getElementById("simulateur");
  if (!root) return;
  var html = document.documentElement;
  var $ = function (sel) { return root.querySelector(sel); };
  var $$ = function (sel) { return root.querySelectorAll(sel); };

  // Voitures (valeurs approximatives) : batterie utile (kWh), consommation (kWh/100 km), charge max en AC et en DC (kW)
  var CARS = [
    { id: "moyenne", g: "autre", n: { fr: "Voiture électrique moyenne", en: "Average electric car", es: "Coche eléctrico medio" }, bat: 60, conso: 16, ac: 22, dc: 350 },
    { id: "model3", g: "tesla", n: "Tesla Model 3", bat: 60, conso: 14.5, ac: 11, dc: 170 },
    { id: "model3lr", g: "tesla", n: { fr: "Tesla Model 3 Grande Autonomie", en: "Tesla Model 3 Long Range", es: "Tesla Model 3 Gran Autonomía" }, bat: 75, conso: 15, ac: 11, dc: 250 },
    { id: "modely", g: "tesla", n: "Tesla Model Y", bat: 60, conso: 15.5, ac: 11, dc: 175 },
    { id: "models", g: "tesla", n: "Tesla Model S", bat: 95, conso: 18, ac: 11, dc: 250 },
    { id: "zoe", g: "autre", n: "Renault Zoé", bat: 52, conso: 17, ac: 22, dc: 50 },
    { id: "megane", g: "autre", n: "Renault Mégane E-Tech", bat: 60, conso: 16, ac: 22, dc: 130 },
    { id: "e208", g: "autre", n: "Peugeot e-208", bat: 48, conso: 15.5, ac: 11, dc: 100 },
    { id: "id3", g: "autre", n: "Volkswagen ID.3", bat: 58, conso: 15.5, ac: 11, dc: 120 },
    { id: "mg4", g: "autre", n: "MG4", bat: 64, conso: 16, ac: 11, dc: 140 },
    { id: "ioniq5", g: "autre", n: "Hyundai Ioniq 5", bat: 77, conso: 17, ac: 11, dc: 230 },
    { id: "ev6", g: "autre", n: "Kia EV6", bat: 77, conso: 17.5, ac: 11, dc: 235 },
    { id: "500e", g: "autre", n: "Fiat 500e", bat: 42, conso: 14, ac: 11, dc: 85 },
    { id: "spring", g: "autre", n: "Dacia Spring", bat: 27, conso: 14, ac: 7, dc: 30 },
    { id: "perso", g: "perso", n: { fr: "Personnalisée…", en: "Custom…", es: "Personalizado…" }, bat: 60, conso: 16, ac: 11, dc: 150 }
  ];
  var GROUPS = [
    { g: "tesla", n: "Tesla" },
    { g: "autre", n: { fr: "Autres marques", en: "Other brands", es: "Otras marcas" } },
    { g: "perso", n: { fr: "À toi de choisir", en: "Your choice", es: "Tú eliges" } }
  ];
  // Puissances qu'on peut choisir à la borne selon la prise (kW)
  var POWERS = { ac: [3.7, 7.4, 11, 22], dc: [50, 100, 150, 350] };
  var DEFAULT_POWER = { ac: 11, dc: 150 };
  var FUELS = {
    diesel: { n: { fr: "Diesel", en: "Diesel", es: "Diésel" }, price: 1.70, conso: 6, co2: 2.65 },
    essence: { n: { fr: "Essence", en: "Petrol", es: "Gasolina" }, price: 1.80, conso: 6.5, co2: 2.30 }
  };
  var CO2_ELEC = 0.05;   // kg de CO2 par kWh (électricité française, très bas carbone)
  var TREE = 25;         // kg de CO2 absorbés par un arbre en un an (environ)

  // Réglages choisis (gardés pour la prochaine visite)
  var cfg = (function () {
    var d = { car: "moyenne", bat: 60, conso: 16, ac: 22, dc: 350, start: 20, target: 100, price: 0.56,
              fuel: "diesel", fuelPrice: 1.70, fuelConso: 6, home: 0.25, km: 1000, trip: "200", tripKm: 100 };
    try { var s = JSON.parse(localStorage.getItem("sim-cfg") || "{}"); for (var k in s) if (k in d) d[k] = s[k]; } catch (e) {}
    return d;
  })();
  function saveCfg() { try { localStorage.setItem("sim-cfg", JSON.stringify(cfg)); } catch (e) {} }

  var T = {
    fr: { idle: "Disponible", auth: "Autorisé", plugged: "Véhicule branché", charging: "En charge", full: "Objectif atteint", done: "Terminé, borne libérée",
          mBadge: "🪪 Badge accepté : la charge est autorisée. Branche maintenant le câble.",
          mPlug: { ac: "🔌 Type 2 branché : courant alternatif, de 3,7 à 22 kW. Choisis la puissance de la borne.",
                   dc: "⚡ Combo CCS2 branché : courant continu, de 50 à 350 kW. C’est la charge rapide. Choisis la puissance." },
          mPower: function (p) { return "🎚️ Puissance de la borne réglée sur " + p + " kW."; },
          mLimit: function (b, c) { return " La voiture n’accepte que " + c + " kW : la borne de " + b + " kW ne charge pas plus vite."; },
          mStart: "▶ La charge démarre. Suis-la en direct sur la plateforme.",
          mFull: function (p) { return "🔋 Objectif atteint (" + p + " %) ! La borne s’arrête toute seule."; },
          mTaper: "📉 Au-dessus de 80 %, la puissance baisse pour protéger la batterie.",
          ticket: function (e, d, c, pr) { return "🧾 Ticket : " + e + " kWh en " + d + ", soit " + c + " € (" + pr + " €/kWh). La borne est libérée."; },
          save: function (km, f, g) { return " 🚗 " + km + " km d’autonomie : en " + f.toLowerCase() + ", ça aurait coûté " + g + " €."; },
          restart: "Nouvelle charge", min: "min", h: "h",
          info: function (c, r) { return "Recharge max de la voiture : " + c.ac + " kW en AC, " + c.dc + " kW en DC · Autonomie batterie pleine : environ " + r + " km"; },
          span: function (a, b) { return "(de " + a + " % à " + b + " %)"; },
          trees: function (n) { return "≈ " + n + " arbre" + (n > 1 ? "s" : "") + " pendant un an"; },
          fill: "un plein ≈ 5 min",
          stops: function (n) { return n === 0 ? "✅ Pas besoin de s’arrêter : une charge suffit." : "🔌 Il faut environ " + n + " arrêt" + (n > 1 ? "s" : "") + " de recharge rapide (10 → 80 %) en route."; },
          tripCo2: function (a, b) { return " 🌱 CO₂ : " + a + " kg en thermique, " + b + " kg en électrique."; },
          noCharge: "aucune charge",
          mNewCar: "🔄 Réglage changé : la borne est libérée. Passe le badge pour une nouvelle charge.",
          tesla: " · Tesla : en Europe, elle se charge avec une prise Combo CCS2, comme pendant mon test chez VEV." },
    en: { idle: "Available", auth: "Authorized", plugged: "Vehicle plugged in", charging: "Charging", full: "Target reached", done: "Finished, charger released",
          mBadge: "🪪 Badge accepted: charging is authorized. Now plug in the cable.",
          mPlug: { ac: "🔌 Type 2 plugged in: alternating current, from 3.7 to 22 kW. Choose the charger’s power.",
                   dc: "⚡ Combo CCS2 plugged in: direct current, from 50 to 350 kW. This is fast charging. Choose the power." },
          mPower: function (p) { return "🎚️ Charger power set to " + p + " kW."; },
          mLimit: function (b, c) { return " The car only accepts " + c + " kW: the " + b + " kW charger is no faster."; },
          mStart: "▶ Charging starts. Follow it live on the platform.",
          mFull: function (p) { return "🔋 Target reached (" + p + "%)! The charger stops by itself."; },
          mTaper: "📉 Above 80%, power drops to protect the battery.",
          ticket: function (e, d, c, pr) { return "🧾 Receipt: " + e + " kWh in " + d + ", that’s €" + c + " (€" + pr + "/kWh). The charger is released."; },
          save: function (km, f, g) { return " 🚗 " + km + " km of range: with a " + f.toLowerCase() + " car, it would have cost €" + g + "."; },
          restart: "New charge", min: "min", h: "h",
          info: function (c, r) { return "Car’s max charging: " + c.ac + " kW AC, " + c.dc + " kW DC · Full battery range: about " + r + " km"; },
          span: function (a, b) { return "(from " + a + "% to " + b + "%)"; },
          trees: function (n) { return "≈ " + n + " tree" + (n > 1 ? "s" : "") + " for a year"; },
          fill: "a full tank ≈ 5 min",
          stops: function (n) { return n === 0 ? "✅ No need to stop: one charge is enough." : "🔌 You need about " + n + " fast-charging stop" + (n > 1 ? "s" : "") + " (10 → 80%) on the way."; },
          tripCo2: function (a, b) { return " 🌱 CO₂: " + a + " kg with fuel, " + b + " kg electric."; },
          noCharge: "no charging",
          mNewCar: "🔄 Setting changed: the charger is released. Swipe the badge for a new charge.",
          tesla: " · Tesla: in Europe, it charges with a Combo CCS2 plug, like during my test at VEV." },
    es: { idle: "Disponible", auth: "Autorizado", plugged: "Vehículo conectado", charging: "Cargando", full: "Objetivo alcanzado", done: "Terminado, cargador liberado",
          mBadge: "🪪 Tarjeta aceptada: la carga está autorizada. Ahora conecta el cable.",
          mPlug: { ac: "🔌 Tipo 2 conectado: corriente alterna, de 3,7 a 22 kW. Elige la potencia del cargador.",
                   dc: "⚡ Combo CCS2 conectado: corriente continua, de 50 a 350 kW. Es la carga rápida. Elige la potencia." },
          mPower: function (p) { return "🎚️ Potencia del cargador ajustada a " + p + " kW."; },
          mLimit: function (b, c) { return " El coche solo acepta " + c + " kW: el cargador de " + b + " kW no carga más rápido."; },
          mStart: "▶ La carga empieza. Síguela en directo en la plataforma.",
          mFull: function (p) { return "🔋 ¡Objetivo alcanzado (" + p + " %)! El cargador se detiene solo."; },
          mTaper: "📉 Por encima del 80 %, la potencia baja para proteger la batería.",
          ticket: function (e, d, c, pr) { return "🧾 Ticket: " + e + " kWh en " + d + ", o sea " + c + " € (" + pr + " €/kWh). El cargador queda libre."; },
          save: function (km, f, g) { return " 🚗 " + km + " km de autonomía: con " + f.toLowerCase() + ", habría costado " + g + " €."; },
          restart: "Nueva carga", min: "min", h: "h",
          info: function (c, r) { return "Carga máx. del coche: " + c.ac + " kW en AC, " + c.dc + " kW en DC · Autonomía con batería llena: unos " + r + " km"; },
          span: function (a, b) { return "(del " + a + " % al " + b + " %)"; },
          trees: function (n) { return "≈ " + n + " árbol" + (n > 1 ? "es" : "") + " durante un año"; },
          fill: "un depósito ≈ 5 min",
          stops: function (n) { return n === 0 ? "✅ No hace falta parar: una carga basta." : "🔌 Hacen falta unas " + n + " parada" + (n > 1 ? "s" : "") + " de carga rápida (10 → 80 %) en el camino."; },
          tripCo2: function (a, b) { return " 🌱 CO₂: " + a + " kg con combustible, " + b + " kg en eléctrico."; },
          noCharge: "ninguna carga",
          mNewCar: "🔄 Ajuste cambiado: el cargador queda libre. Pasa la tarjeta para una nueva carga.",
          tesla: " · Tesla: en Europa, se carga con un conector Combo CCS2, como en mi prueba en VEV." }
  };
  function tr() { return T[html.lang] || T.fr; }
  function L(o) { return typeof o === "string" ? o : (o[html.lang] || o.fr); }
  // nombres avec une virgule en français et en espagnol
  function num(x, d) { var v = x.toFixed(d); return html.lang === "en" ? v : v.replace(".", ","); }
  function euro(x, d) { d = d === undefined ? 2 : d; return html.lang === "en" ? (x < 0 ? "-€" + num(-x, d) : "€" + num(x, d)) : num(x, d) + " €"; }
  function money(x) { return euro(Math.round(x), 0); }
  function kw(p) { return num(p, p % 1 ? 1 : 0); }
  function fmtTime(m) {
    var t = tr();
    if (m < 60) return Math.max(0, Math.round(m)) + " " + t.min;
    var hh = Math.floor(m / 60), mm = Math.round(m % 60);
    if (mm === 60) { hh++; mm = 0; }
    return hh + " " + t.h + " " + String(mm).padStart(2, "0");
  }
  function car() { return cfg.car === "perso" ? { bat: cfg.bat, conso: cfg.conso, ac: cfg.ac, dc: cfg.dc } : CARS.filter(function (c) { return c.id === cfg.car; })[0] || CARS[0]; }
  function fuel() { return FUELS[cfg.fuel] || FUELS.diesel; }

  // ---------- La charge en direct ----------
  var state, plug, soc, energy, minutes, power, maxPower, timer, tapered;
  function reset() {
    clearInterval(timer);
    state = "idle"; plug = null; soc = cfg.start; energy = 0; minutes = 0; power = 0; maxPower = 0; tapered = false;
    fillPowers();
  }
  function fillPowers() {
    var sel = $(".sim-power-select select");
    sel.innerHTML = "";
    if (!plug) { sel.innerHTML = "<option>—</option>"; return; }
    POWERS[plug].forEach(function (p) {
      var o = document.createElement("option");
      o.value = p; o.textContent = kw(p) + " kW";
      if (p === DEFAULT_POWER[plug]) o.selected = true;
      sel.appendChild(o);
    });
    maxPower = DEFAULT_POWER[plug];
  }
  // Puissance réelle : la plus petite entre la borne et ce que la voiture accepte, puis la baisse en DC quand la batterie se remplit
  function powerFor(s, p, kind) {
    var c = car(), m = Math.min(p, kind === "ac" ? c.ac : c.dc);
    if (kind === "ac") return s < 98 ? m : Math.min(m, 3);
    var f;
    if (s < 50) f = 1;
    else if (s < 80) f = 1 - (s - 50) / 30 * 0.6;    // 100 % -> 40 %
    else f = 0.4 - (s - 80) / 20 * 0.35;             // 40 % -> 5 %
    return Math.max(Math.min(5, m), m * f);
  }
  // Temps (minutes) pour aller d'un niveau à un autre avec une puissance de borne donnée
  function chargeTime(p, kind, from, to) {
    var c = car(), s = from, t = 0, dt = 0.5;
    while (s < to && t < 6000) { s += powerFor(s, p, kind) * dt / 60 / c.bat * 100; t += dt; }
    return t;
  }

  // ---------- Comparatif pour une énergie donnée (kWh) ----------
  function compare(e) {
    var c = car(), f = fuel();
    var km = e / c.conso * 100, liters = km / 100 * cfg.fuelConso;
    return { km: km, elec: e * cfg.price, home: e * cfg.home, fuel: liters * cfg.fuelPrice,
             co2Fuel: liters * f.co2, co2Elec: e * CO2_ELEC };
  }

  function say(msg) { var m = $(".sim-msg"); m.textContent = msg; m.classList.toggle("on", !!msg); }

  function render() {
    var t = tr();
    var sim = $(".sim");
    sim.dataset.state = state; sim.dataset.plug = plug || "";
    $(".sim-status").textContent = { idle: t.idle, auth: t.auth, plugged: t.plugged, charging: t.charging, full: t.full, done: t.done }[state];
    $(".sim-power").textContent = (state === "charging" ? num(power, power < 10 ? 1 : 0) : "0") + " kW";
    $(".sim-energy").textContent = num(energy, 1) + " kWh";
    $(".sim-soc").textContent = Math.floor(soc) + " %";
    $(".sim-time").textContent = fmtTime(minutes);
    $(".sim-power-select select").disabled = !plug || state === "done";
    var x = compare(energy);
    $(".cmp-km").textContent = Math.round(x.km) + " km";
    $(".cmp-elec").textContent = euro(x.elec);
    $(".cmp-diesel").textContent = euro(x.fuel);
    $(".cmp-home").textContent = euro(x.home);
    $(".cmp-save").textContent = euro(x.fuel - x.elec);
    $(".cmp-save").classList.toggle("neg", x.fuel - x.elec < 0);
    $(".cmp-co2").textContent = num(x.co2Fuel, 1) + " kg → " + num(x.co2Elec, 1) + " kg";
    var max = Math.max(x.fuel, x.elec, x.home, 0.01);
    $(".cmp-bar-elec").style.width = (x.elec / max * 100) + "%";
    $(".cmp-bar-home").style.width = (x.home / max * 100) + "%";
    $(".cmp-bar-diesel").style.width = (x.fuel / max * 100) + "%";
    $(".sim-bat").setAttribute("width", (56 * soc / 100).toFixed(1));
    $(".sim-screen-text").textContent =
      state === "idle" ? "--" : state === "auth" ? "OK" : state === "plugged" ? plug.toUpperCase() :
      state === "charging" ? Math.round(power) + "kW" : "✓";
    var can = { badge: state === "idle" || state === "done", plug: state === "auth", start: state === "plugged", stop: state === "charging" || state === "full" };
    $$(".sim-btn").forEach(function (b) { b.disabled = !can[b.dataset.act]; });
    $$(".sim-steps li").forEach(function (li) { li.classList.toggle("sim-current", !!can[li.dataset.step]); });
    var badge = $('[data-act="badge"]');
    if (state === "done") { badge.dataset.restart = "1"; badge.setAttribute("data-label", t.restart); }
    else delete badge.dataset.restart;
    renderCards();
  }

  function tick() {
    var speed = parseInt($(".sim-speed-sel").value, 10);   // minutes simulées par minute réelle
    var dtMin = speed * 0.1 / 60;                          // un tick = 0,1 s réelle
    var c = car();
    power = powerFor(soc, maxPower, plug);
    energy += power * dtMin / 60;
    soc = Math.min(100, cfg.start + energy / c.bat * 100);
    minutes += dtMin;
    if (!tapered && soc >= 80 && plug === "dc" && cfg.target > 80) { tapered = true; say(tr().mTaper); }
    if (soc >= cfg.target) {
      clearInterval(timer); state = "full"; power = 0;
      soc = cfg.target; energy = c.bat * (cfg.target - cfg.start) / 100;
      say(tr().mFull(cfg.target));
    }
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
      plug = b.dataset.plug; state = "plugged"; fillPowers();
      say(t.mPlug[plug] + limitNote());
    } else if (act === "start") {
      if (soc >= cfg.target) { say(t.mFull(cfg.target)); state = "full"; render(); return; }
      state = "charging"; say(t.mStart + limitNote());
      clearInterval(timer); timer = setInterval(tick, 100);
    } else if (act === "stop") {
      clearInterval(timer);
      var x = compare(energy);
      state = "done"; power = 0;
      say(t.ticket(num(energy, 1), fmtTime(minutes), num(x.elec, 2), num(cfg.price, 2)) + t.save(Math.round(x.km), L(fuel().n), num(x.fuel, 2)));
    }
    render();
  });
  // La voiture limite la puissance ?
  function limitNote() {
    if (!plug) return "";
    var lim = plug === "ac" ? car().ac : car().dc;
    return maxPower > lim ? tr().mLimit(kw(maxPower), kw(lim)) : "";
  }
  $(".sim-power-select select").addEventListener("change", function (e) {
    maxPower = parseFloat(e.target.value);
    say(tr().mPower(kw(maxPower)) + limitNote());
    if (state === "charging") power = powerFor(soc, maxPower, plug);
    render();
  });

  // ---------- Réglages ----------
  // Menu des voitures en deux groupes : Tesla, ou une autre marque
  function fillCars() {
    var sel = $(".set-car");
    sel.innerHTML = GROUPS.map(function (gr) {
      return '<optgroup label="' + L(gr.n) + '">' + CARS.filter(function (c) { return c.g === gr.g; }).map(function (c) {
        return '<option value="' + c.id + '">' + L(c.n) + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
    sel.value = cfg.car;
    if (!sel.value) { cfg.car = "moyenne"; sel.value = "moyenne"; }
  }
  function carEntry() { return CARS.filter(function (c) { return c.id === cfg.car; })[0] || CARS[0]; }
  function paintSettings() {
    var c = car();
    $(".set-bat").value = c.bat; $(".set-conso").value = c.conso; $(".set-maxac").value = c.ac; $(".set-maxdc").value = c.dc;
    $$(".set-custom").forEach(function (l) { l.hidden = cfg.car !== "perso"; });
    $(".set-start").value = cfg.start; $(".out-start").textContent = cfg.start + " %";
    $(".set-target").value = cfg.target; $(".out-target").textContent = cfg.target + " %";
    $(".set-price").value = cfg.price;
    $(".set-fuel").value = cfg.fuel; $(".set-fuelprice").value = cfg.fuelPrice; $(".set-fuelconso").value = cfg.fuelConso; $(".set-home").value = cfg.home;
    $(".set-km").value = cfg.km; $(".out-km").textContent = cfg.km + " km";
    $(".set-trip").value = cfg.trip; $(".set-tripkm").value = cfg.tripKm;
    $(".set-trip-custom").hidden = cfg.trip !== "custom";
    var e = carEntry();
    $(".set-info").textContent = tr().info({ ac: kw(c.ac), dc: kw(c.dc) }, Math.round(c.bat / c.conso * 100)) + (e.g === "tesla" ? tr().tesla : "");
    $(".sim-car-name").textContent = e.g === "perso" ? L({ fr: "Ma voiture", en: "My car", es: "Mi coche" }) : L(e.n);
    $(".sim").dataset.brand = e.g;
    $$(".cmp-fuel-name").forEach(function (s) { s.textContent = L(fuel().n); });
    // les menus déroulants ne peuvent pas cacher les traductions : on écrit le texte dans la bonne langue
    Array.prototype.forEach.call($(".set-fuel").options, function (o) { o.textContent = L(FUELS[o.value].n); });
    var trip = $(".set-trip");
    trip.querySelector('[value="30"]').textContent = L({ fr: "Aller-retour au lycée (30 km)", en: "Return trip to school (30 km)", es: "Ida y vuelta al instituto (30 km)" });
    trip.querySelector('[value="custom"]').textContent = L({ fr: "Autre distance…", en: "Other distance…", es: "Otra distancia…" });
  }
  function readNum(el, min, max, def) {
    var v = parseFloat(String(el.value).replace(",", "."));
    if (isNaN(v)) return def;
    return Math.min(max, Math.max(min, v));
  }
  function onSetting(e) {
    var el = e.target;
    if (!el.matches || !el.matches("input, select") || el.matches(".sim-speed-sel, .sim-power-select select")) return;
    if (el.matches(".set-car")) {
      cfg.car = el.value;
      var c = CARS.filter(function (x) { return x.id === cfg.car; })[0];
      if (cfg.car !== "perso" && c) { cfg.bat = c.bat; cfg.conso = c.conso; cfg.ac = c.ac; cfg.dc = c.dc; }
    }
    if (el.matches(".set-bat")) cfg.bat = readNum(el, 15, 130, 60);
    if (el.matches(".set-conso")) cfg.conso = readNum(el, 10, 35, 16);
    if (el.matches(".set-maxac")) cfg.ac = readNum(el, 3, 22, 11);
    if (el.matches(".set-maxdc")) cfg.dc = readNum(el, 20, 350, 150);
    if (el.matches(".set-start")) { cfg.start = +el.value; if (cfg.target <= cfg.start) cfg.target = Math.min(100, cfg.start + 5); }
    if (el.matches(".set-target")) { cfg.target = +el.value; if (cfg.target <= cfg.start) cfg.start = Math.max(0, cfg.target - 5); }
    if (el.matches(".set-price")) cfg.price = readNum(el, 0, 2, 0.56);
    if (el.matches(".set-fuel")) { cfg.fuel = el.value; cfg.fuelPrice = FUELS[cfg.fuel].price; cfg.fuelConso = FUELS[cfg.fuel].conso; }
    if (el.matches(".set-fuelprice")) cfg.fuelPrice = readNum(el, 0.5, 4, 1.7);
    if (el.matches(".set-fuelconso")) cfg.fuelConso = readNum(el, 2, 20, 6);
    if (el.matches(".set-home")) cfg.home = readNum(el, 0, 1, 0.25);
    if (el.matches(".set-km")) cfg.km = +el.value;
    if (el.matches(".set-trip")) cfg.trip = el.value;
    if (el.matches(".set-tripkm")) cfg.tripKm = readNum(el, 1, 5000, 100);
    saveCfg();
    // la batterie de départ ne change qu'entre deux charges
    // changer de voiture (ou de batterie au départ) pendant une charge : la borne s'arrête et on recommence
    var resets = el.matches(".set-car, .set-bat, .set-conso, .set-maxac, .set-maxdc, .set-start");
    if (resets && state !== "idle") { reset(); say(tr().mNewCar); }
    else if (state === "idle") soc = cfg.start;
    // ne pas réécrire le champ qu'on est en train de taper
    var typing = el.matches("input[type=number]") ? el : null, keep = typing ? typing.value : null;
    paintSettings();
    if (typing) typing.value = keep;
    render(); renderMonth(); renderTimes(); renderTrip();
  }
  root.addEventListener("input", onSetting);
  root.addEventListener("change", function (e) { if (e.target.matches && e.target.matches("select")) onSetting(e); });

  // ---------- Coût aux 100 km, CO₂, temps, autonomie ----------
  function renderCards() {
    var c = car(), t = tr(), x = compare(c.conso);   // 100 km = « conso » kWh
    $(".c100").innerHTML = "⛽ " + euro(x.fuel) + "<br>⚡ " + euro(x.elec) + "<br>🏠 " + euro(x.home);
    var year = compare(cfg.km * 12 / 100 * c.conso), saved = year.co2Fuel - year.co2Elec;
    $(".cco2").innerHTML = "<b>" + num(saved / 1000, 1) + " t</b><br>" + t.trees(Math.max(1, Math.round(saved / TREE)));
    var p = plug ? maxPower : DEFAULT_POWER.dc, kind = plug || "dc";
    var real = Math.min(p, kind === "ac" ? c.ac : c.dc);
    $(".ctime").innerHTML = "<b>" + fmtTime(c.conso / real * 60) + "</b> (" + kw(real) + " kW)<br>" + t.fill;
    $(".crange").innerHTML = "<b>≈ " + Math.round(c.bat / c.conso * 100) + " km</b><br>" + kw(c.bat) + " kWh";
  }

  // ---------- Par mois / an / 5 ans ----------
  function renderMonth() {
    var c = car(), m = compare(cfg.km / 100 * c.conso);
    $(".m-diesel").textContent = money(m.fuel);
    $(".m-elec").textContent = money(m.elec);
    $(".m-home").textContent = money(m.home);
    [[1, "1"], [12, "12"], [60, "60"]].forEach(function (k) {
      $(".s-b" + k[1]).textContent = money((m.fuel - m.elec) * k[0]);
      $(".s-b" + k[1]).classList.toggle("neg", m.fuel - m.elec < 0);
      $(".s-h" + k[1]).textContent = money((m.fuel - m.home) * k[0]);
      var co2 = (m.co2Fuel - m.co2Elec) * k[0];
      $(".s-c" + k[1]).textContent = co2 >= 1000 ? num(co2 / 1000, 1) + " t" : Math.round(co2) + " kg";
    });
    renderCards();
  }

  // ---------- Temps de charge selon la puissance de la borne ----------
  function renderTimes() {
    var from = cfg.start, to = cfg.target, c = car(), rows = [];
    $(".cmp-span").textContent = tr().span(from, to);
    [["ac", 3.7], ["ac", 7.4], ["ac", 11], ["ac", 22], ["dc", 50], ["dc", 150], ["dc", 350]].forEach(function (r) {
      rows.push({ kind: r[0], p: r[1], real: Math.min(r[1], r[0] === "ac" ? c.ac : c.dc), t: to > from ? chargeTime(r[1], r[0], from, to) : 0 });
    });
    var max = Math.max.apply(null, rows.map(function (r) { return r.t; })) || 1;
    $(".cmp-times").innerHTML = rows.map(function (r) {
      var limited = r.real < r.p;
      return '<span class="cmp-name">' + (r.kind === "ac" ? "🔌 " : "⚡ ") + kw(r.p) + " kW" +
             (limited ? ' <small class="lim">→ ' + kw(r.real) + " kW</small>" : "") + "</span>" +
             '<span class="cmp-track"><span class="cmp-bar ' + (r.kind === "ac" ? "cmp-bar-home" : "cmp-bar-elec") + '" style="width:' + (r.t / max * 100) + '%"></span></span>' +
             "<strong>" + (r.t ? fmtTime(r.t) : tr().noCharge) + "</strong>";
    }).join("");
  }

  // ---------- Trajets ----------
  function renderTrip() {
    var c = car(), t = tr(), km = cfg.trip === "custom" ? cfg.tripKm : +cfg.trip;
    var x = compare(km / 100 * c.conso);
    $(".t-fuel").textContent = euro(x.fuel);
    $(".t-elec").textContent = euro(x.elec);
    $(".t-home").textContent = euro(x.home);
    // départ batterie pleine (on garde 10 % de marge), puis arrêts de recharge rapide de 10 % à 80 %
    var range = c.bat / c.conso * 100, stops = Math.max(0, Math.ceil((km - range * 0.9) / (range * 0.7)));
    $(".cmp-trip-info").textContent = t.stops(stops) + t.tripCo2(num(x.co2Fuel, 1), num(x.co2Elec, 1));
  }

  // ---------- Onglets du comparatif (l'onglet choisi est gardé) ----------
  function showTab(name) {
    $$(".cmp-tabs [data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"); });
    $$(".cmp-panel").forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    try { localStorage.setItem("sim-tab", name); } catch (e) {}
  }
  $$(".cmp-tabs [data-tab]").forEach(function (b) { b.addEventListener("click", function () { showTab(b.dataset.tab); }); });
  (function () { var s = null; try { s = localStorage.getItem("sim-tab"); } catch (e) {} if (s && $('.cmp-panel[data-panel="' + s + '"]')) showTab(s); })();

  // Changement de langue : réécrire les textes
  new MutationObserver(function () {
    var p = maxPower; fillPowers(); if (plug) { maxPower = p; $(".sim-power-select select").value = p; }
    fillCars(); paintSettings(); render(); renderMonth(); renderTimes(); renderTrip(); say("");
  }).observe(html, { attributes: true, attributeFilter: ["lang"] });

  fillCars(); paintSettings();
  reset(); render(); renderMonth(); renderTimes(); renderTrip();
})();
