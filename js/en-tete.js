/* =========================================================
   Module en-tête : date du jour, menu déroulant « Catégories »
   et menu qui disparaît / réapparaît au défilement.
   ========================================================= */

/* ---------- Date du jour dans le bandeau du haut ---------- */
export function afficherDateDuJour() {
  const zone = document.querySelector(".top-bar time");
  if (!zone) return;

  const aujourdhui = new Date();
  const texte = aujourdhui.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // "mercredi 5 novembre 2026" -> "Mercredi 5 novembre 2026"
  zone.textContent = texte.charAt(0).toUpperCase() + texte.slice(1);
  // Attribut datetime au format AAAA-MM-JJ (date locale, pas UTC)
  const mois = String(aujourdhui.getMonth() + 1).padStart(2, "0");
  const jour = String(aujourdhui.getDate()).padStart(2, "0");
  zone.setAttribute("datetime", aujourdhui.getFullYear() + "-" + mois + "-" + jour);
}

/* ---------- Menu déroulant « Catégories » ---------- */
/* Le CSS l'ouvre déjà au survol ; le JS ajoute le clic, aria-expanded
   et la touche Échap pour les utilisateurs au clavier. */
function ouvrirMenu(menu, etat) {
  menu.classList.toggle("is-open", etat);
  menu.querySelector(".dropdown-toggle").setAttribute("aria-expanded", String(etat));
}

export function initialiserMenuDeroulant() {
  const menu = document.querySelector(".nav-dropdown");
  if (!menu) return;

  const bouton = menu.querySelector(".dropdown-toggle");
  bouton.setAttribute("aria-expanded", "false");

  bouton.addEventListener("click", function () {
    ouvrirMenu(menu, !menu.classList.contains("is-open"));
  });

  // Échap ferme le menu et redonne le focus au bouton
  menu.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      ouvrirMenu(menu, false);
      bouton.focus();
    }
  });

  // Tab au-delà du dernier lien : le focus quitte le menu, on le ferme
  menu.addEventListener("focusout", function (event) {
    if (!menu.contains(event.relatedTarget)) {
      ouvrirMenu(menu, false);
    }
  });
}

/* Un clic ailleurs dans la page ferme le menu. Écouteur posé une seule
   fois sur le document : il cherche le menu de la page affichée. */
export function fermerMenuAuClicExterieur() {
  document.addEventListener("click", function (event) {
    const menu = document.querySelector(".nav-dropdown");
    if (menu && !menu.contains(event.target)) {
      ouvrirMenu(menu, false);
    }
  });
}

/* ---------- Menu dynamique au défilement ---------- */
/* On descend : l'en-tête se cache pour laisser la place au contenu.
   On remonte : il réapparaît aussitôt. */
export function initialiserMenuAuScroll() {
  let dernierePosition = window.scrollY;

  window.addEventListener("scroll", function () {
    const entete = document.querySelector(".site-header");
    if (!entete) return;

    const position = window.scrollY;
    const ecart = position - dernierePosition;

    // Ne jamais cacher un menu ouvert ou un lien qui a le focus clavier
    const menuOuvert = entete.querySelector(".nav-toggle:checked, .nav-dropdown.is-open")
      || entete.contains(document.activeElement);

    // Petite ombre dès qu'on a quitté le haut de la page
    entete.classList.toggle("is-scrolled", position > 10);

    if (ecart > 5 && position > entete.offsetHeight && !menuOuvert) {
      entete.classList.add("is-hidden");      // on descend
    } else if (ecart < -5 || position <= entete.offsetHeight) {
      entete.classList.remove("is-hidden");   // on remonte, ou retour en haut
    }

    dernierePosition = position;
  }, { passive: true });
}
