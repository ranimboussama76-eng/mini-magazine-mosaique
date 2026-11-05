/* =========================================================
   Module lecture : barre de progression (pages article)
   et bouton « retour en haut » (toutes les pages).
   Les deux éléments sont créés une seule fois : ils restent en
   place quand la navigation dynamique change le contenu.
   ========================================================= */

export function initialiserProgression() {
  const barre = document.createElement("div");
  barre.className = "reading-progress";
  barre.setAttribute("aria-hidden", "true");
  document.body.appendChild(barre);

  function mettreAJour() {
    const texte = document.querySelector(".article-body");
    if (!texte) {
      barre.style.transform = "scaleX(0)"; // pas d'article sur cette page
      return;
    }
    // Part du texte déjà passée au-dessus du bas de l'écran :
    // 100 % quand la dernière ligne de l'article devient visible
    const basEcran = window.scrollY + window.innerHeight;
    let ratio = (basEcran - texte.offsetTop) / texte.offsetHeight;
    ratio = Math.min(Math.max(ratio, 0), 1);
    barre.style.transform = "scaleX(" + ratio + ")";
  }

  window.addEventListener("scroll", mettreAJour, { passive: true });
  window.addEventListener("resize", mettreAJour);
  mettreAJour();
  return mettreAJour; // rappelée après chaque changement de page
}

export function initialiserRetourHaut() {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "back-to-top";
  bouton.setAttribute("aria-label", "Revenir en haut de la page");
  bouton.textContent = "↑";
  document.body.appendChild(bouton);

  window.addEventListener("scroll", function () {
    bouton.classList.toggle("is-visible", window.scrollY > 600);
  }, { passive: true });

  bouton.addEventListener("click", function () {
    // Pas d'animation si l'utilisateur les a désactivées
    const sansAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: sansAnimation ? "auto" : "smooth" });
    document.querySelector(".logo").focus({ preventScroll: true });
  });
}
