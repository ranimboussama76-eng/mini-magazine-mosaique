/* =========================================================
   Mosaïque — magazine en ligne
   Script commun à toutes les pages (semaine 2 : JavaScript)
   Chargé avec "defer" : le HTML est déjà lu quand il s'exécute.
   ========================================================= */

/* Signale au CSS que JavaScript est actif (voir le menu déroulant) */
document.documentElement.classList.add("js");

/* ---------- 1. Date du jour dans le bandeau du haut ---------- */
function afficherDateDuJour() {
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

/* ---------- 2. Menu déroulant « Catégories » ---------- */
/* Le CSS l'ouvre déjà au survol ; le JS ajoute le clic, aria-expanded
   et la touche Échap pour les utilisateurs au clavier. */
function initialiserMenuDeroulant() {
  const menu = document.querySelector(".nav-dropdown");
  if (!menu) return;

  const bouton = menu.querySelector(".dropdown-toggle");
  bouton.setAttribute("aria-expanded", "false");

  function ouvrir(etat) {
    menu.classList.toggle("is-open", etat);
    bouton.setAttribute("aria-expanded", String(etat));
  }

  bouton.addEventListener("click", function () {
    ouvrir(!menu.classList.contains("is-open"));
  });

  // Échap ferme le menu et redonne le focus au bouton
  menu.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      ouvrir(false);
      bouton.focus();
    }
  });

  // Un clic ailleurs dans la page ferme le menu
  document.addEventListener("click", function (event) {
    if (!menu.contains(event.target)) {
      ouvrir(false);
    }
  });

  // Tab au-delà du dernier lien : le focus quitte le menu, on le ferme
  menu.addEventListener("focusout", function (event) {
    if (!menu.contains(event.relatedTarget)) {
      ouvrir(false);
    }
  });
}

/* ---------- 3. Filtre des articles par rubrique (accueil) ---------- */
/* Sans JavaScript, les pastilles mènent aux pages rubriques.
   Avec JavaScript, elles filtrent la grille sans recharger la page. */
function initialiserFiltre() {
  const liens = document.querySelectorAll(".topics .topic-list a");
  const cartes = document.querySelectorAll("#articles .card");
  const titre = document.getElementById("titre-articles");
  if (liens.length === 0 || cartes.length === 0) return;

  // Rubrique d'un élément = sa classe "tag-xxx" ("toutes" pour le lien Toutes)
  function rubriqueDe(element) {
    for (const nom of element.classList) {
      if (nom.startsWith("tag-")) return nom.slice(4);
    }
    return "toutes";
  }

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

/* ---------- 4. Validation des formulaires ---------- */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Affiche (ou efface si message vide) l'erreur sous un champ
function afficherErreur(champ, message) {
  const idErreur = champ.id + "-erreur";
  let erreur = document.getElementById(idErreur);

  if (!erreur) {
    erreur = document.createElement("p");
    erreur.id = idErreur;
    erreur.className = "field-error";
    champ.setAttribute("aria-describedby", idErreur);
    // Newsletter : le message va sous le formulaire entier
    const parent = champ.closest(".form-field") || champ.closest("form");
    parent.appendChild(erreur);
  }

  erreur.textContent = message;
  if (message) {
    champ.setAttribute("aria-invalid", "true");
  } else {
    champ.removeAttribute("aria-invalid");
  }
}

// Message de réussite en bas du formulaire
function afficherSucces(formulaire, message) {
  let zone = formulaire.querySelector(".form-success");
  if (!zone) {
    zone = document.createElement("p");
    zone.className = "form-success";
    zone.setAttribute("role", "status");
    formulaire.appendChild(zone);
  }
  zone.textContent = message;
}

// Règles de chaque champ : renvoie le message d'erreur, ou "" si tout va bien
function verifierChamp(champ) {
  const valeur = champ.value.trim();

  switch (champ.name) {
    case "nom":
      if (valeur === "") return "Indiquez votre nom.";
      if (valeur.length < 3) return "Le nom doit contenir au moins 3 caractères.";
      if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(valeur)) return "Le nom ne doit contenir que des lettres.";
      return "";
    case "email":
      if (valeur === "") return "Indiquez votre adresse e-mail.";
      if (!REGEX_EMAIL.test(valeur)) return "Adresse e-mail invalide (exemple : nom@domaine.com).";
      return "";
    case "sujet":
      if (valeur === "") return "Choisissez un sujet.";
      return "";
    case "message":
      if (valeur.length < 20) return "Votre message doit contenir au moins 20 caractères.";
      if (valeur.length > 500) return "Votre message ne doit pas dépasser 500 caractères.";
      return "";
    default:
      return "";
  }
}

function initialiserFormulaire(formulaire, messageSucces) {
  if (!formulaire) return;
  const champs = formulaire.querySelectorAll("input, select, textarea");

  // On remplace les bulles du navigateur par nos propres messages
  formulaire.noValidate = true;

  champs.forEach(function (champ) {
    // Vérification quand on quitte le champ...
    champ.addEventListener("blur", function () {
      afficherErreur(champ, verifierChamp(champ));
    });
    // ...puis en direct une fois qu'une erreur est affichée
    champ.addEventListener("input", function () {
      if (champ.getAttribute("aria-invalid") === "true") {
        afficherErreur(champ, verifierChamp(champ));
      }
    });
  });

  formulaire.addEventListener("submit", function (event) {
    event.preventDefault(); // semaine 3 : envoi réel vers le script PHP
    let premierInvalide = null;

    champs.forEach(function (champ) {
      const message = verifierChamp(champ);
      afficherErreur(champ, message);
      if (message && !premierInvalide) premierInvalide = champ;
    });

    if (premierInvalide) {
      afficherSucces(formulaire, "");
      premierInvalide.focus();
      return;
    }

    afficherSucces(formulaire, messageSucces);
    formulaire.reset();
    mettreAJourCompteur();
  });
}

/* Compteur de caractères du message (page contact) */
let mettreAJourCompteur = function () {};

function initialiserCompteur() {
  const zoneTexte = document.getElementById("message");
  if (!zoneTexte) return;

  const compteur = document.createElement("p");
  compteur.className = "char-count";
  compteur.setAttribute("aria-live", "polite");
  zoneTexte.insertAdjacentElement("afterend", compteur);

  mettreAJourCompteur = function () {
    const total = zoneTexte.value.length;
    compteur.textContent = total + " / 500 caractères";
    compteur.classList.toggle("is-over", total > 500);
  };

  zoneTexte.addEventListener("input", mettreAJourCompteur);
  mettreAJourCompteur();
}

/* ---------- 5. Barre de progression de lecture (pages article) ---------- */
function initialiserProgression() {
  const texte = document.querySelector(".article-body");
  if (!texte) return;

  const barre = document.createElement("div");
  barre.className = "reading-progress";
  barre.setAttribute("aria-hidden", "true");
  document.body.appendChild(barre);

  function mettreAJour() {
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
}

/* ---------- 6. Bouton « retour en haut » ---------- */
function initialiserRetourHaut() {
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

/* ---------- Lancement ---------- */
afficherDateDuJour();
initialiserMenuDeroulant();
initialiserFiltre();
initialiserCompteur();
initialiserFormulaire(document.querySelector(".contact-form"),
  "Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 48 heures.");
initialiserFormulaire(document.querySelector(".newsletter-form"),
  "Merci ! Votre inscription à la newsletter est confirmée.");
initialiserProgression();
initialiserRetourHaut();
