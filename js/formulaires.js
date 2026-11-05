/* =========================================================
   Module formulaires : validation côté client (avant envoi)
   Utilisé par le contact, la newsletter et les commentaires.
   ========================================================= */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Règles de chaque champ : renvoie le message d'erreur, ou "" si tout va bien
export function verifierChamp(champ) {
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
    case "commentaire":
      if (valeur.length < 3) return "Votre commentaire doit contenir au moins 3 caractères.";
      if (valeur.length > 300) return "Votre commentaire ne doit pas dépasser 300 caractères.";
      return "";
    default:
      return "";
  }
}

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

/* quandValide (facultatif) : fonction appelée avec les données du
   formulaire quand tout est correct (ex. : enregistrer un commentaire). */
export function initialiserFormulaire(formulaire, messageSucces, quandValide) {
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

    if (quandValide) quandValide(new FormData(formulaire));
    afficherSucces(formulaire, messageSucces);
    formulaire.reset();
    // Remet les compteurs de caractères à zéro
    formulaire.querySelectorAll("textarea").forEach(function (zone) {
      zone.dispatchEvent(new Event("input"));
    });
  });
}

/* Compteur de caractères sous une zone de texte (contact, commentaires) */
export function initialiserCompteur(zoneTexte, maximum) {
  if (!zoneTexte) return;

  const compteur = document.createElement("p");
  compteur.className = "char-count";
  compteur.setAttribute("aria-live", "polite");
  zoneTexte.insertAdjacentElement("afterend", compteur);

  function mettreAJour() {
    const total = zoneTexte.value.length;
    compteur.textContent = total + " / " + maximum + " caractères";
    compteur.classList.toggle("is-over", total > maximum);
  }

  zoneTexte.addEventListener("input", mettreAJour);
  mettreAJour();
}
