/* =========================================================
   Module témoignages : défilement automatique avec fondu
   Les témoignages viennent du fichier local data/temoignages.json
   (lu avec fetch). Un nouveau témoignage toutes les 6 secondes.
   ========================================================= */

const DELAI = 6000; // millisecondes entre deux témoignages
let minuteur = null; // setInterval en cours (un seul pour tout le site)

function arreterDefilement() {
  clearInterval(minuteur);
  minuteur = null;
}

// Crée le <figure> d'un témoignage à partir des données JSON
function creerTemoignage(donnees) {
  const figure = document.createElement("figure");
  figure.className = "testimonial";

  const citation = document.createElement("blockquote");
  const texte = document.createElement("p");
  texte.textContent = "« " + donnees.texte + " »";
  citation.appendChild(texte);

  const legende = document.createElement("figcaption");
  const nom = document.createElement("span");
  nom.className = "testimonial-name";
  nom.textContent = donnees.nom;
  legende.append(nom, ", " + donnees.role.toLowerCase());

  figure.append(citation, legende);
  return figure;
}

export async function initialiserTemoignages() {
  // La navigation dynamique peut quitter l'accueil : on coupe l'ancien minuteur
  arreterDefilement();

  const section = document.querySelector(".testimonials");
  if (!section) return;

  let liste;
  try {
    const url = new URL(section.dataset.source, document.baseURI);
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error("Fichier introuvable");
    liste = await reponse.json();
  } catch (erreur) {
    return; // en file:// par exemple : le témoignage écrit dans le HTML reste affiché
  }
  // Pendant le chargement, on a peut-être déjà changé de page
  if (!document.contains(section)) return;

  const scene = section.querySelector(".testimonial-stage");
  const zonePoints = section.querySelector(".testimonial-dots");
  const boutonPause = section.querySelector(".testimonial-pause");

  const temoignages = liste.map(creerTemoignage);
  scene.replaceChildren(...temoignages);

  let index = 0;
  let pauseUtilisateur = false;

  const points = temoignages.map(function (temoignage, i) {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "carousel-dot";
    point.setAttribute("aria-label", "Témoignage " + (i + 1) + " sur " + temoignages.length);
    point.addEventListener("click", function () {
      afficher(i);
    });
    zonePoints.appendChild(point);
    return point;
  });

  function afficher(nouvelIndex) {
    index = (nouvelIndex + temoignages.length) % temoignages.length;
    temoignages.forEach(function (temoignage, i) {
      temoignage.classList.toggle("is-active", i === index); // fondu en CSS
    });
    points.forEach(function (point, i) {
      if (i === index) {
        point.setAttribute("aria-current", "true");
      } else {
        point.removeAttribute("aria-current");
      }
    });
  }

  function demarrer() {
    if (minuteur || pauseUtilisateur) return;
    minuteur = setInterval(function () {
      afficher(index + 1);
    }, DELAI);
    // Pendant le défilement automatique, on n'annonce pas chaque changement
    scene.setAttribute("aria-live", "off");
  }

  function mettreEnPause() {
    arreterDefilement();
    scene.setAttribute("aria-live", "polite");
  }

  function mettreAJourBouton() {
    boutonPause.textContent = pauseUtilisateur ? "Lecture" : "Pause";
    boutonPause.setAttribute("aria-label", pauseUtilisateur
      ? "Reprendre le défilement des témoignages"
      : "Mettre en pause le défilement des témoignages");
  }

  // Bouton Pause / Lecture
  boutonPause.addEventListener("click", function () {
    pauseUtilisateur = !pauseUtilisateur;
    mettreAJourBouton();
    if (pauseUtilisateur) {
      mettreEnPause();
    } else {
      demarrer();
    }
  });

  // Pause automatique pendant qu'on lit (souris dessus ou focus clavier)
  section.addEventListener("mouseenter", mettreEnPause);
  section.addEventListener("mouseleave", demarrer);
  section.addEventListener("focusin", mettreEnPause);
  section.addEventListener("focusout", function (event) {
    if (!section.contains(event.relatedTarget)) demarrer();
  });

  // Animations réduites demandées : pas de défilement automatique
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pauseUtilisateur = true;
  }

  mettreAJourBouton();
  afficher(0);
  if (pauseUtilisateur) {
    scene.setAttribute("aria-live", "polite");
  } else {
    demarrer();
  }
}
