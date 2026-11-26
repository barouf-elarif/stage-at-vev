// Menu déroulant des thèmes : automatique, clair, sombre, éclipse ou Noël
(function () {
  var menu = document.querySelector(".theme-menu");
  if (!menu) return;

  function applyTheme(choice) {
    if (choice === "light" || choice === "dark" || choice === "eclipse" || choice === "noel") {
      document.documentElement.dataset.theme = choice;
    } else {
      delete document.documentElement.dataset.theme; // suit le réglage de l'appareil
      choice = "auto";
    }
    menu.querySelectorAll("[data-theme-choice]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.themeChoice === choice);
    });
    try { localStorage.setItem("theme", choice); } catch (e) {}
  }

  menu.querySelectorAll("[data-theme-choice]").forEach(function (b) {
    b.addEventListener("click", function () {
      applyTheme(b.dataset.themeChoice);
      menu.open = false;
    });
  });

  // Fermer le menu quand on clique ailleurs
  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target)) menu.open = false;
  });

  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(saved);
})();
