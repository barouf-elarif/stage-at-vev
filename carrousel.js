// Carrousels de photos : glisser au doigt, flèches, points et touches ← →
(function () {
  document.querySelectorAll(".carousel").forEach(function (car) {
    var track = car.querySelector(".carousel-track");
    var slides = [].slice.call(track.children);
    var dotsBox = car.querySelector(".carousel-dots");
    var dots = slides.map(function (s, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "carousel-dot";
      d.setAttribute("aria-label", (i + 1) + " / " + slides.length);
      d.addEventListener("click", function () { go(i); });
      dotsBox.appendChild(d);
      return d;
    });
    var counter = document.createElement("span");
    counter.className = "carousel-count";
    dotsBox.appendChild(counter);

    function index() { return Math.round(track.scrollLeft / track.clientWidth) || 0; }
    function go(i) {
      i = (i + slides.length) % slides.length;   // on boucle au bout
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    }
    function update() {
      var i = index();
      dots.forEach(function (d, j) { d.classList.toggle("active", j === i); });
      counter.textContent = (i + 1) + " / " + slides.length;
    }
    car.querySelector(".carousel-prev").addEventListener("click", function () { go(index() - 1); });
    car.querySelector(".carousel-next").addEventListener("click", function () { go(index() + 1); });
    track.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    car.tabIndex = 0;
    car.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index() + 1); }
    });
    update();
  });
})();
