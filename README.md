# Mosaïque — mini magazine en ligne

Mini projet du module Développement Web (FIA3, ISSAT Sousse, A.U. 2025/2026),
sujet 6 : **Mini magazine en ligne**.

Réalisé par **Ranim Boussama** et **Yasmine Mtawaa**.

Site en ligne : <https://mini-magazine-mosaique.vercel.app/>

## Contenu

Un magazine sur la tech et le numérique, avec cinq rubriques : IA, Gadgets,
Jeux vidéo, Cybersécurité et Dev web.

- `index.html` : accueil (articles à la une, grille de 9 articles, témoignages, newsletter)
- `pages/article-1.html` … `article-10.html` : pages article
- `pages/categorie-*.html` : une page par rubrique
- `pages/contact.html` : formulaire de contact

## Étapes du projet

### Semaine 1 : HTML et CSS

- HTML5 sémantique, une seule feuille de style `css/style.css`
- Grille d'articles avec CSS Grid, zoom au survol des images
- Responsive : 3 colonnes (ordinateur), 2 (tablette), 1 (téléphone), menu burger
- Charte graphique et maquettes réalisées sur Figma

### Semaine 2 : JavaScript

JavaScript « vanilla » (sans bibliothèque), organisé en modules ES dans `js/` :

| Fonctionnalité | Module |
| --- | --- |
| Navigation dynamique entre les pages (fetch local) | `js/navigation.js` |
| Carrousel des articles à la une | `js/carrousel.js` |
| « J'aime » et commentaires sauvegardés avec localStorage | `js/reactions.js` |
| Menu qui disparaît en descendant et réapparaît en remontant | `js/en-tete.js` |
| Témoignages automatiques avec fondu (lus avec fetch dans `data/temoignages.json`) | `js/temoignages.js` |
| Validation des formulaires côté client (contact, newsletter, commentaires) | `js/formulaires.js` |
| Filtre des articles par rubrique sur l'accueil | `js/filtre.js` |
| Barre de progression de lecture et bouton « retour en haut » | `js/lecture.js` |

`js/main.js` est le point d'entrée : il importe les modules et les lance.

Le site reste utilisable sans JavaScript, et les animations s'arrêtent si
l'utilisateur a activé la réduction des animations (`prefers-reduced-motion`).

## Lancer le projet

Les modules JavaScript et `fetch` ne fonctionnent pas en ouvrant
`index.html` directement (adresse en `file://`). Il faut un serveur local :

- **VS Code** : installer l'extension **Live Server**, ouvrir le dossier du
  projet, puis clic droit sur `index.html` → *Open with Live Server* ;
- **ou Python** : dans le dossier du projet, lancer `python -m http.server 8000`,
  puis ouvrir <http://localhost:8000>.

## Structure

```
mosaique/
├── index.html
├── README.md
├── css/style.css
├── data/temoignages.json
├── images/            (photos des articles, Unsplash)
├── js/                (modules JavaScript)
└── pages/             (articles, rubriques, contact)
```

## Crédits

- Polices : Playfair Display et Inter (Google Fonts)
- Photos des articles : [Unsplash](https://unsplash.com/)
