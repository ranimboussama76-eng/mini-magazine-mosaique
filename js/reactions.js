/* =========================================================
   Module réactions : « J'aime » et commentaires des articles
   Tout est sauvegardé dans localStorage, sous une seule clé :
   { "article-1": { "aime": true, "commentaires": [ {...}, ... ] }, ... }
   ========================================================= */

import { initialiserFormulaire, initialiserCompteur } from "./formulaires.js";

const CLE = "mosaique-reactions";

// Lecture / écriture protégées : localStorage peut être bloqué (navigation privée)
function lireReactions() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || {};
  } catch (erreur) {
    return {};
  }
}

function enregistrerReactions(toutes) {
  try {
    localStorage.setItem(CLE, JSON.stringify(toutes));
  } catch (erreur) {
    // Stockage indisponible : la réaction reste visible jusqu'au rechargement
  }
}

export function initialiserReactions() {
  const section = document.querySelector(".reactions");
  if (!section) return;

  const idArticle = section.dataset.article;
  const toutes = lireReactions();
  const reactions = toutes[idArticle] || { aime: false, commentaires: [] };

  function sauvegarder() {
    toutes[idArticle] = reactions;
    enregistrerReactions(toutes);
  }

  /* ---------- Bouton « J'aime » ---------- */
  const bouton = section.querySelector(".like-btn");
  const compteur = bouton.querySelector(".like-count");
  const likesDeDepart = Number(bouton.dataset.likes); // nombre fictif écrit dans le HTML

  function afficherLike() {
    compteur.textContent = likesDeDepart + (reactions.aime ? 1 : 0);
    bouton.setAttribute("aria-pressed", String(reactions.aime));
    bouton.classList.toggle("is-liked", reactions.aime);
  }

  bouton.addEventListener("click", function () {
    reactions.aime = !reactions.aime;
    sauvegarder();
    afficherLike();
  });

  /* ---------- Commentaires ---------- */
  const liste = section.querySelector(".comment-list");
  const nombre = section.querySelector(".comment-count");
  const messageVide = section.querySelector(".comment-empty");

  // textContent (et jamais innerHTML) : un commentaire contenant du HTML
  // s'affiche comme du texte et ne peut pas modifier la page
  function creerCommentaire(commentaire, position) {
    const element = document.createElement("li");
    element.className = "comment";

    const entete = document.createElement("p");
    entete.className = "comment-meta";
    const auteur = document.createElement("strong");
    auteur.textContent = commentaire.nom;
    const date = document.createElement("time");
    date.dateTime = commentaire.date;
    date.textContent = new Date(commentaire.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });
    entete.append(auteur, " · ", date);

    const texte = document.createElement("p");
    texte.className = "comment-text";
    texte.textContent = commentaire.texte;

    const supprimer = document.createElement("button");
    supprimer.type = "button";
    supprimer.className = "comment-delete";
    supprimer.textContent = "Supprimer";
    supprimer.setAttribute("aria-label", "Supprimer le commentaire de " + commentaire.nom);
    supprimer.addEventListener("click", function () {
      reactions.commentaires.splice(position, 1);
      sauvegarder();
      afficherCommentaires();
      section.querySelector(".comments-title").focus();
    });

    element.append(entete, texte, supprimer);
    return element;
  }

  function afficherCommentaires() {
    liste.replaceChildren(...reactions.commentaires.map(creerCommentaire));
    nombre.textContent = reactions.commentaires.length;
    messageVide.hidden = reactions.commentaires.length > 0;
  }

  // Le titre peut recevoir le focus après une suppression
  section.querySelector(".comments-title").setAttribute("tabindex", "-1");

  // Le formulaire réutilise la validation du module formulaires.js
  const formulaire = section.querySelector(".comment-form");
  initialiserCompteur(formulaire.querySelector("textarea"), 300);
  initialiserFormulaire(formulaire, "Merci ! Votre commentaire est publié.", function (donnees) {
    reactions.commentaires.push({
      nom: donnees.get("nom").trim(),
      texte: donnees.get("commentaire").trim(),
      date: new Date().toISOString()
    });
    sauvegarder();
    afficherCommentaires();
  });

  afficherLike();
  afficherCommentaires();
}
