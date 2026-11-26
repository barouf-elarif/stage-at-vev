// Thèmes du site : menu déroulant + thèmes secrets (page Centres d'intérêt)
(function () {
  var THEMES = ["light", "dark", "violet", "vert", "orange", "eclipse", "noel",
                "bloodborne", "astro", "ragnarok", "echecs"];
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

  // Thèmes secrets : la section est cachée. Cliquer 5 fois de suite sur le score Elo la fait apparaître.
  var secrets = document.getElementById("secrets");
  var elo = document.querySelector(".stat-value");
  if (secrets && elo) {
    var unlocked = false;
    try { unlocked = localStorage.getItem("secrets") === "1"; } catch (e) {}
    if (unlocked) secrets.hidden = false;

    var clicks = 0, timer = null;
    elo.addEventListener("click", function () {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1500);
      if (clicks >= 5) {
        clicks = 0;
        secrets.hidden = false;
        secrets.classList.add("secret-reveal");
        try { localStorage.setItem("secrets", "1"); } catch (e) {}
        secrets.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(saved);
})();
