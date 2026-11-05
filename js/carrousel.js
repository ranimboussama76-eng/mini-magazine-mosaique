/* =========================================================
   Module carrousel : articles « À la une » de l'accueil
   Flèches, points, touches ← → du clavier et glissement du doigt.
   ========================================================= */

export function initialiserCarrousel() {
  const carrousel = document.querySelector(".carousel");
  if (!carrousel) return;

  const piste = carrousel.querySelector(".carousel-track");
  const diapos = carrousel.querySelectorAll(".carousel-slide");
  const zonePoints = carrousel.querySelector(".carousel-dots");
  const statut = carrousel.querySelector(".carousel-status");
  const total = diapos.length;
  let index = 0;

  // Un point par diapositive, pour aller directement à un article
  const points = [];
  diapos.forEach(function (diapo, i) {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "carousel-dot";
    point.setAttribute("aria-label", "Afficher l'article " + (i + 1) + " sur " + total);
    point.addEventListener("click", function () {
      afficher(i, true);
    });
    zonePoints.appendChild(point);
    points.push(point);
  });

  // annoncer = false au chargement : on ne lit pas « 1 sur 3 » sans raison
  function afficher(nouvelIndex, annoncer) {
    // Boucle : après le dernier article on revient au premier, et inversement
    index = (nouvelIndex + total) % total;
    piste.style.transform = "translateX(" + (-index * 100) + "%)";

    diapos.forEach(function (diapo, i) {
      // inert : les liens des diapositives cachées ne reçoivent pas le focus
      diapo.inert = i !== index;
    });
    points.forEach(function (point, i) {
      if (i === index) {
        point.setAttribute("aria-current", "true");
      } else {
        point.removeAttribute("aria-current");
      }
    });

    if (annoncer) statut.textContent = "Article " + (index + 1) + " sur " + total;
  }

  carrousel.querySelector(".carousel-prev").addEventListener("click", function () {
    afficher(index - 1, true);
  });
  carrousel.querySelector(".carousel-next").addEventListener("click", function () {
    afficher(index + 1, true);
  });

  // Flèches du clavier quand le focus est dans le carrousel
  carrousel.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") afficher(index - 1, true);
    if (event.key === "ArrowRight") afficher(index + 1, true);
  });

  // Glissement du doigt sur téléphone (au moins 50 px)
  let departX = null;
  piste.addEventListener("touchstart", function (event) {
    departX = event.touches[0].clientX;
  }, { passive: true });
  piste.addEventListener("touchend", function (event) {
    if (departX === null) return;
    const ecart = event.changedTouches[0].clientX - departX;
    if (Math.abs(ecart) > 50) afficher(ecart < 0 ? index + 1 : index - 1, true);
    departX = null;
  });

  afficher(0, false);
}
