/* =========================================================
   Module filtre : articles de l'accueil filtrés par rubrique
   Sans JavaScript, les pastilles mènent aux pages rubriques.
   Avec JavaScript, elles filtrent la grille sans recharger la page.
   ========================================================= */

// Rubrique d'un élément = sa classe "tag-xxx" ("toutes" pour le lien Toutes)
function rubriqueDe(element) {
  for (const nom of element.classList) {
    if (nom.startsWith("tag-")) return nom.slice(4);
  }
  return "toutes";
}

export function initialiserFiltre() {
  const liens = document.querySelectorAll(".topics .topic-list a");
  const cartes = document.querySelectorAll("#articles .card");
  const titre = document.getElementById("titre-articles");
  if (liens.length === 0 || cartes.length === 0) return;

  liens.forEach(function (lien) {
    lien.addEventListener("click", function (event) {
      event.preventDefault();
      const rubrique = rubriqueDe(lien);
      let visibles = 0;

      cartes.forEach(function (carte) {
        const etiquette = carte.querySelector(".tag");
        const garder = rubrique === "toutes" || rubriqueDe(etiquette) === rubrique;
        carte.hidden = !garder;
        if (garder) visibles++;
      });

      // Mise à jour du lien actif
      liens.forEach(function (autre) {
        autre.classList.remove("is-active");
        autre.removeAttribute("aria-current");
      });
      lien.classList.add("is-active");
      lien.setAttribute("aria-current", "true");

      // Le titre annonce le résultat (aria-live dans le HTML)
      if (rubrique === "toutes") {
        titre.textContent = "Derniers articles";
      } else {
        titre.textContent = lien.textContent + " : " + visibles + " article" + (visibles > 1 ? "s" : "");
      }
    });
  });
}
