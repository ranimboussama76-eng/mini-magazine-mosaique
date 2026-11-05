/* =========================================================
   Module navigation : navigation dynamique entre les pages (fetch)
   Un clic sur un lien interne charge la page avec fetch et remplace
   l'en-tête, le contenu et le pied de page, sans recharger le site.
   Sans JavaScript (ou si fetch échoue), les liens marchent normalement.
   ========================================================= */

// Parties de la page remplacées à chaque navigation
const ZONES = [".site-header", "main", ".site-footer"];

let cheminActuel = location.pathname;
let apresChargement = function () {};

// Zone invisible lue par les lecteurs d'écran : « Page chargée : … »
function annoncer(message) {
  let zone = document.getElementById("annonce-page");
  if (!zone) {
    zone = document.createElement("p");
    zone.id = "annonce-page";
    zone.className = "visually-hidden";
    zone.setAttribute("role", "status");
    document.body.appendChild(zone);
  }
  zone.textContent = message;
}

// Faut-il charger ce lien avec fetch ?
function estLienInterne(lien, event) {
  if (event.defaultPrevented) return false;            // déjà géré (ex. : filtre)
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return false;                                       // nouvel onglet, etc.
  }
  if (lien.target || lien.hasAttribute("download")) return false;
  if (lien.origin !== location.origin) return false;   // site externe, mailto:
  if (!/(\.html|\/)$/.test(lien.pathname)) return false;
  // Ancre dans la même page (ex. : « Aller au contenu ») : le navigateur s'en occupe
  if (lien.pathname === location.pathname && lien.hash) return false;
  return true;
}

async function chargerPage(url, ajouterHistorique) {
  document.documentElement.classList.add("is-loading");

  try {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error("Page introuvable : " + reponse.status);
    const html = await reponse.text();
    const nouvellePage = new DOMParser().parseFromString(html, "text/html");

    // L'adresse change AVANT l'insertion : les chemins relatifs des images
    // et des liens (ex. : ../images/...) sont lus depuis la nouvelle page.
    if (ajouterHistorique) history.pushState(null, "", url);
    cheminActuel = new URL(url, location.href).pathname;

    ZONES.forEach(function (selecteur) {
      const ancienne = document.querySelector(selecteur);
      const nouvelle = nouvellePage.querySelector(selecteur);
      if (ancienne && nouvelle) ancienne.replaceWith(nouvelle);
    });
    document.title = nouvellePage.title;

    const main = document.querySelector("main");
    main.classList.add("page-entree"); // petit fondu d'apparition (CSS)

    apresChargement(); // relance les fonctions de la page (formulaires, carrousel...)

    // Position : l'ancre demandée (ex. : #articles) ou le haut de la page
    const cible = location.hash && document.querySelector(location.hash);
    if (cible) {
      cible.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }

    // Le focus va sur le titre de la nouvelle page (lecteurs d'écran, clavier)
    const titre = main.querySelector("h1");
    if (titre) {
      titre.setAttribute("tabindex", "-1");
      titre.focus({ preventScroll: true });
    }
    annoncer("Page chargée : " + document.title);
  } catch (erreur) {
    // Problème réseau, page absente, ouverture en file:// : navigation classique
    window.location.href = url;
  } finally {
    document.documentElement.classList.remove("is-loading");
  }
}

export function initialiserNavigation(fonctionApresChargement) {
  // fetch ne marche pas en ouvrant le fichier directement (file://)
  if (location.protocol === "file:") return;
  apresChargement = fonctionApresChargement;

  // Un seul écouteur pour tous les liens, même ceux ajoutés plus tard
  document.addEventListener("click", function (event) {
    const lien = event.target.closest("a[href]");
    if (!lien || !estLienInterne(lien, event)) return;
    event.preventDefault();
    chargerPage(lien.href, true);
  });

  // Boutons Précédent / Suivant du navigateur
  window.addEventListener("popstate", function () {
    // Simple changement d'ancre dans la même page : rien à charger
    if (location.pathname === cheminActuel) return;
    chargerPage(location.href, false);
  });
}
