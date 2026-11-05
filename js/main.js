/* =========================================================
   Mosaïque — magazine en ligne
   Point d'entrée JavaScript (semaine 2), chargé par toutes les pages :
   <script type="module" src="js/main.js">
   Un module = une fonctionnalité. Les modules (et fetch) demandent un
   serveur local, par exemple l'extension Live Server de VS Code.
   ========================================================= */

import { afficherDateDuJour, initialiserMenuDeroulant, fermerMenuAuClicExterieur, initialiserMenuAuScroll } from "./en-tete.js";
import { initialiserFiltre } from "./filtre.js";
import { initialiserFormulaire, initialiserCompteur } from "./formulaires.js";
import { initialiserCarrousel } from "./carrousel.js";
import { initialiserTemoignages } from "./temoignages.js";
import { initialiserReactions } from "./reactions.js";
import { initialiserProgression, initialiserRetourHaut } from "./lecture.js";
import { initialiserNavigation } from "./navigation.js";

/* Signale au CSS que JavaScript est actif (menu déroulant, carrousel) */
document.documentElement.classList.add("js");

/* ---------- Une seule fois : éléments qui restent d'une page à l'autre ---------- */
fermerMenuAuClicExterieur();
initialiserMenuAuScroll();
initialiserRetourHaut();
const mettreAJourProgression = initialiserProgression();

/* ---------- À chaque page : ce qui dépend du contenu affiché ----------
   Appelée au premier chargement, puis après chaque navigation fetch. */
function initialiserPage() {
  afficherDateDuJour();
  initialiserMenuDeroulant();
  initialiserFiltre();
  initialiserCarrousel();
  initialiserTemoignages();
  initialiserReactions();
  initialiserCompteur(document.getElementById("message"), 500);
  initialiserFormulaire(document.querySelector(".contact-form"),
    "Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 48 heures.");
  initialiserFormulaire(document.querySelector(".newsletter-form"),
    "Merci ! Votre inscription à la newsletter est confirmée.");
  mettreAJourProgression();
}

initialiserPage();
initialiserNavigation(initialiserPage);
