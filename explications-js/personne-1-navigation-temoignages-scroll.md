# Personne 1 : Navigation dynamique, Témoignages, Menu au scroll

Your 3 features have something in common: **they all react to what happens on the whole page** (clicks on links, time passing, scrolling), and two of them use **`fetch`** to read a local file.

| # | Feature | File | Lines |
|---|---|---|---|
| 1 | Navigation dynamique (fetch local) | `js/navigation.js` | 1–109 |
| 2 | Témoignages automatiques avec fondu | `js/temoignages.js` + `data/temoignages.json` | 1–142 / 1–27 |
| 3 | Menu dynamique au scroll | `js/en-tete.js` | 73–101 |

> ⚠️ **Demo:** open the site with **Live Server** (right-click `index.html` → "Open with Live Server"). If you double-click the file (`file://`), `fetch` is blocked: the navigation and the testimonials won't work.

---

## 0. How all the JavaScript is linked (30-second intro)

**`index.html`, line 15** (the same line is in every page):
```html
<script type="module" src="js/main.js"></script>
```
- `type="module"` = the JS is split into **modules**: one file = one feature.
- Only **one** file is loaded: `main.js`. It's the **conductor** 🎼 that calls all the others.

**`js/main.js`** (45 lines):
```js
/* Lines 9–16: bring in the functions from the other files */
import { ..., initialiserMenuAuScroll } from "./en-tete.js";     // ← your feature 3
import { initialiserTemoignages } from "./temoignages.js";       // ← your feature 2
import { initialiserNavigation } from "./navigation.js";         // ← your feature 1
...

/* Line 19: tells the CSS "JavaScript is working" (adds class="js" on <html>) */
document.documentElement.classList.add("js");

/* Lines 22–25: run ONCE (things that stay from one page to another) */
initialiserMenuAuScroll();                                       // ← feature 3
...

/* Lines 29–42: run on EVERY page (things that depend on the page content) */
function initialiserPage() {
  ...
  initialiserTemoignages();                                      // ← feature 2
  ...
}

initialiserPage();                       // line 44: first time, when the site opens
initialiserNavigation(initialiserPage);  // line 45: feature 1 receives initialiserPage
```

**Like you're five:** `main.js` is the **remote control** 📺. Each button starts one feature. `import` means "go get the function in that file". `export` (in the other files) means "this function can be borrowed".

🇫🇷 *« Notre JavaScript est découpé en modules : un fichier par fonctionnalité. Le HTML charge seulement `main.js`, qui importe les fonctions des autres fichiers avec `import` et les lance. »*

---

# 1️⃣ Navigation dynamique (fetch local)

**File:** `js/navigation.js` (lines 1–109)
**Linked to:** `js/main.js` line 45 · CSS `css/style.css` lines 1021–1039 (`.is-loading`, `.page-entree`)

## The big idea, like you're five 🏠
Normally, when you click a link, the browser **throws away the whole page** and builds the new one from zero: white flash, everything reloads.

With dynamic navigation, it's like **changing the furniture in 3 rooms instead of moving house**:
1. we **catch** the click before the browser leaves the page;
2. we **download** the new page in the background with `fetch` (from our own files, that's why it's "local");
3. we **swap only 3 parts**: the header, the `<main>` content and the footer;
4. we **change the address** in the URL bar so it still looks like a normal page.

Result: no white flash, a smooth fade-in, and the "back to top" button and the reading bar stay in place.

## The code, piece by piece

### Lines 8–25: the setup
```js
// Parties de la page remplacées à chaque navigation
const ZONES = [".site-header", "main", ".site-footer"];  // the 3 "rooms" we swap

let cheminActuel = location.pathname;       // the page we are on now (e.g. "/index.html")
let apresChargement = function () {};       // a function to run after each new page (empty for now)

// Zone invisible lue par les lecteurs d'écran : « Page chargée : … »
function annoncer(message) {
  let zone = document.getElementById("annonce-page");
  if (!zone) {                                   // if it doesn't exist yet...
    zone = document.createElement("p");          // ...create a <p>
    zone.id = "annonce-page";
    zone.className = "visually-hidden";          // invisible on screen (class from the CSS)
    zone.setAttribute("role", "status");         // screen readers READ what is written here
    document.body.appendChild(zone);             // add it to the page
  }
  zone.textContent = message;                    // write the message → it gets read aloud
}
```
- `const` = a value that never changes; `let` = a value that can change.
- `annoncer()` is for **blind users**: since the page doesn't really reload, their screen reader wouldn't know the page changed. We write "Page chargée : …" in an invisible zone with `role="status"`, and it's read aloud.

### Lines 27–39: should we catch this link?
```js
function estLienInterne(lien, event) {
  if (event.defaultPrevented) return false;            // another script already handled it (e.g. the filter)
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return false;                                       // middle click, Ctrl+click = "open in new tab" → leave it
  }
  if (lien.target || lien.hasAttribute("download")) return false;  // target="_blank" or a download
  if (lien.origin !== location.origin) return false;   // another website, or mailto: → leave it
  if (!/(\.html|\/)$/.test(lien.pathname)) return false; // not an .html page → leave it
  // Ancre dans la même page (ex. : « Aller au contenu ») : le navigateur s'en occupe
  if (lien.pathname === location.pathname && lien.hash) return false;
  return true;                                          // ✅ a normal link to one of OUR pages
}
```
**Like you're five:** a **bouncer at the door** 🚪. He only lets in "our own pages". Everything else (other sites, e-mail links, Ctrl+click to open a new tab) goes the **normal way**.
- `return false` = "not for us"; `return true` = "we handle it".
- `/(\.html|\/)$/` is a **regex**: "ends with `.html` or with `/`".

### Lines 41–88: load the new page (the heart ❤️)
```js
async function chargerPage(url, ajouterHistorique) {
  document.documentElement.classList.add("is-loading");   // CSS: the content becomes half-transparent

  try {
    const reponse = await fetch(url);                      // 1. download the page (wait for it)
    if (!reponse.ok) throw new Error("Page introuvable : " + reponse.status);  // 404? → go to catch
    const html = await reponse.text();                     // 2. read it as text
    const nouvellePage = new DOMParser().parseFromString(html, "text/html");  // 3. turn the text into a page we can search

    // L'adresse change AVANT l'insertion : les chemins relatifs des images
    // et des liens (ex. : ../images/...) sont lus depuis la nouvelle page.
    if (ajouterHistorique) history.pushState(null, "", url);  // 4. change the URL in the address bar
    cheminActuel = new URL(url, location.href).pathname;

    ZONES.forEach(function (selecteur) {                   // 5. for each of the 3 rooms...
      const ancienne = document.querySelector(selecteur);  //    the old one (on screen)
      const nouvelle = nouvellePage.querySelector(selecteur); //  the new one (downloaded)
      if (ancienne && nouvelle) ancienne.replaceWith(nouvelle); // swap them
    });
    document.title = nouvellePage.title;                   // 6. new title in the browser tab

    const main = document.querySelector("main");
    main.classList.add("page-entree"); // petit fondu d'apparition (CSS)

    apresChargement(); // relance les fonctions de la page (formulaires, carrousel...)

    // Position : l'ancre demandée (ex. : #articles) ou le haut de la page
    const cible = location.hash && document.querySelector(location.hash);
    if (cible) {
      cible.scrollIntoView();                              // go to the #anchor
    } else {
      window.scrollTo(0, 0);                               // or to the top
    }

    // Le focus va sur le titre de la nouvelle page (lecteurs d'écran, clavier)
    const titre = main.querySelector("h1");
    if (titre) {
      titre.setAttribute("tabindex", "-1");                // makes the h1 focusable by code
      titre.focus({ preventScroll: true });
    }
    annoncer("Page chargée : " + document.title);
  } catch (erreur) {
    // Problème réseau, page absente, ouverture en file:// : navigation classique
    window.location.href = url;                            // plan B: normal page change
  } finally {
    document.documentElement.classList.remove("is-loading"); // always: back to normal opacity
  }
}
```
Key words to master:
- **`async` / `await`**: downloading takes time. `await` = "**wait** here until it's finished, then continue". A function that uses `await` must be marked `async`.
- **`fetch(url)`**: asks the server for a file. Here, our own HTML files → "fetch local".
- **`reponse.ok`**: `true` if the server said "OK" (code 200), `false` if "not found" (404).
- **`DOMParser`**: turns a long text of HTML into a real page that we can search with `querySelector`.
- **`history.pushState`**: changes the URL **without** reloading, and adds an entry to the history (so "Back" works).
- **`replaceWith`**: replaces an element with another.
- **`try / catch / finally`**:
  - `try` = "try this";
  - `catch` = "if something breaks, do this instead" → we fall back to a **normal** page change, so the site **never breaks**;
  - `finally` = "do this **in every case**" → remove the loading effect.

❓ **Why `apresChargement()`?** The new header, forms, carousel... are **brand new HTML elements**. They have **no event listeners** yet (no click detection). So we re-run all the page features. `apresChargement` is `initialiserPage` from `main.js` (it was given on line 45).

### Lines 90–109: start listening
```js
export function initialiserNavigation(fonctionApresChargement) {
  // fetch ne marche pas en ouvrant le fichier directement (file://)
  if (location.protocol === "file:") return;          // no server → do nothing, links stay normal
  apresChargement = fonctionApresChargement;          // remember initialiserPage

  // Un seul écouteur pour tous les liens, même ceux ajoutés plus tard
  document.addEventListener("click", function (event) {
    const lien = event.target.closest("a[href]");     // was the click on (or inside) a link?
    if (!lien || !estLienInterne(lien, event)) return; // no link, or not ours → let the browser do it
    event.preventDefault();                            // ✋ STOP the normal page change
    chargerPage(lien.href, true);                      // and load it our way
  });

  // Boutons Précédent / Suivant du navigateur
  window.addEventListener("popstate", function () {
    // Simple changement d'ancre dans la même page : rien à charger
    if (location.pathname === cheminActuel) return;
    chargerPage(location.href, false);                 // false: don't add to history again
  });
}
```
- **ONE listener on the whole `document`** instead of one per link. This is called **event delegation**: a click on a link "bubbles up" to the document, which catches it. It also works for links that **didn't exist yet** (the new pages).
- **`closest("a[href]")`**: if you click on the image *inside* a card link, it climbs up to find the `<a>`.
- **`event.preventDefault()`**: cancels what the browser would normally do (here: leave the page).
- **`popstate`**: fired when the user clicks the browser's **← Back** / **Forward →** buttons.

### The linked CSS (`css/style.css` lines 1021–1039)
```css
.is-loading main {               /* while loading: content half-transparent */
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.page-entree {                   /* new content: small fade-in animation */
  animation: apparition 0.35s ease-out;
}

@keyframes apparition {          /* the animation: from invisible and 8px lower... */
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }   /* ...to visible and in place */
}
```

## 🧩 Summary in 5 steps
1. **One listener** on the document catches every click on a link.
2. The **bouncer** (`estLienInterne`) checks it's one of our pages.
3. `preventDefault()` stops the normal page change; `fetch` downloads the new page.
4. We **swap** the header, main and footer, change the URL (`pushState`) and the title.
5. We **re-run** the page features, then put the focus on the title. If anything fails, `catch` does a normal page change.

## 🇫🇷 À dire
> « La navigation dynamique change de page sans recharger tout le site. Un seul écouteur `click` sur le document attrape les clics sur les liens, c'est la délégation d'événements. Si c'est un lien vers une de nos pages, `preventDefault()` empêche le changement de page normal. Ensuite, `fetch` télécharge la nouvelle page en local, avec `async` et `await`. On remplace seulement l'en-tête, le contenu et le pied de page, et `history.pushState` met à jour l'adresse. Puis on relance les fonctionnalités de la page. Si quelque chose échoue, le `catch` fait une navigation classique : le site ne casse jamais. »

## ❓ Questions possibles
- **What does `await` do?** It waits for the download to finish before going to the next line, without freezing the page.
- **Why `preventDefault()`?** Without it, the browser would leave the page normally and our code would be useless.
- **What happens without a server (`file://`)?** Line 92 stops the feature, and the links work normally.
- **Why re-run `initialiserPage` after each page?** The new HTML elements have no event listeners yet.
- **Do the Back/Forward buttons work?** Yes, thanks to `pushState` and the `popstate` event.

## 🎬 Demo
1. With Live Server, press **F12** → **Network** tab, then click on an article. You'll see a `fetch` request for `article-X.html`, and the page doesn't flash white.
2. Click the browser's **← Back** button: it works.
3. Bonus: watch the URL change in the address bar.

---

# 2️⃣ Témoignages automatiques avec effet de transition

**Files:** `js/temoignages.js` (1–142) + `data/temoignages.json` (1–27)
**Linked to:** `index.html` lines 266–284 · `js/main.js` line 34 · CSS `css/style.css` lines 1140–1160

## The big idea, like you're five 🎠
The readers' reviews are **not written in the HTML**. They are stored in a **separate data file** (`temoignages.json`). The JS **reads** that file with `fetch`, **builds** the HTML for each review, then shows them **one by one, every 6 seconds**, with a **soft fade** (like slides in a slideshow).

## The data: `data/temoignages.json`
```json
[
  {
    "nom": "Amira K.",
    "role": "Étudiante en informatique",
    "texte": "Les articles vont droit au but. J'ai enfin compris CSS Grid grâce à Mosaïque !"
  },
  { "nom": "Youssef B.", "role": "...", "texte": "..." },
  ...  5 reviews in total
]
```
**JSON** = a text format to store data: `[ ]` = a list, `{ }` = one object with `"key": "value"` pairs. It's like a little **database in a text file**. Advantage: to add a review, you edit the JSON, not the HTML or the JS.

## The HTML: `index.html` lines 266–284
```html
<section class="testimonials" aria-labelledby="titre-temoignages" data-source="data/temoignages.json">
  <!--                                        ↑ data-source: tells the JS WHERE the file is -->
  <div class="container">
    <h2 class="section-title" id="titre-temoignages">Ce qu'en disent nos lecteurs</h2>
    <div class="testimonial-stage">                <!-- the "stage" where the reviews appear -->
      <figure class="testimonial is-active">       <!-- 1 review written by hand = shown even WITHOUT JS -->
        <blockquote><p>« Les articles vont droit au but... »</p></blockquote>
        <figcaption><span class="testimonial-name">Amira K.</span>, étudiante en informatique</figcaption>
      </figure>
    </div>
    <div class="testimonial-controls">
      <div class="testimonial-dots"></div>           <!-- empty: the JS creates the dots -->
      <button type="button" class="testimonial-pause">Pause</button>
    </div>
  </div>
</section>
```
- `data-source="..."`: a **custom attribute** (`data-` + any name). The JS reads it with `section.dataset.source`.

## The code, piece by piece

### Lines 7–13: the timer
```js
const DELAI = 6000; // millisecondes entre deux témoignages  (6000 ms = 6 seconds)
let minuteur = null; // setInterval en cours (un seul pour tout le site)

function arreterDefilement() {
  clearInterval(minuteur);   // stop the timer
  minuteur = null;           // "no timer running"
}
```

### Lines 15–33: build ONE review from the JSON data
```js
function creerTemoignage(donnees) {                 // donnees = { nom, role, texte }
  const figure = document.createElement("figure");  // create <figure>
  figure.className = "testimonial";

  const citation = document.createElement("blockquote");
  const texte = document.createElement("p");
  texte.textContent = "« " + donnees.texte + " »";   // the review text between « »
  citation.appendChild(texte);                       // <p> goes inside <blockquote>

  const legende = document.createElement("figcaption");
  const nom = document.createElement("span");
  nom.className = "testimonial-name";
  nom.textContent = donnees.nom;                     // "Amira K."
  legende.append(nom, ", " + donnees.role.toLowerCase()); // "Amira K., étudiante en informatique"

  figure.append(citation, legende);
  return figure;                                     // the finished HTML block
}
```
**Like you're five:** it's a **LEGO factory** 🧱: it receives the data (name, role, text) and builds the same structure as the HTML written by hand.
- `createElement` = create a tag; `textContent` = put text in it; `append` / `appendChild` = put an element inside another.

### Lines 35–59: read the JSON file with fetch
```js
export async function initialiserTemoignages() {
  // La navigation dynamique peut quitter l'accueil : on coupe l'ancien minuteur
  arreterDefilement();

  const section = document.querySelector(".testimonials");
  if (!section) return;                              // no testimonials on this page → stop

  let liste;
  try {
    const url = new URL(section.dataset.source, document.baseURI);  // "data/temoignages.json" → full address
    const reponse = await fetch(url);                // download the JSON file
    if (!reponse.ok) throw new Error("Fichier introuvable");
    liste = await reponse.json();                    // turn the JSON text into a real JS list
  } catch (erreur) {
    return; // en file:// par exemple : le témoignage écrit dans le HTML reste affiché
  }
  // Pendant le chargement, on a peut-être déjà changé de page
  if (!document.contains(section)) return;

  const scene = section.querySelector(".testimonial-stage");
  const zonePoints = section.querySelector(".testimonial-dots");
  const boutonPause = section.querySelector(".testimonial-pause");

  const temoignages = liste.map(creerTemoignage);    // 5 data objects → 5 <figure> blocks
  scene.replaceChildren(...temoignages);             // put the 5 on the stage (replaces the hand-written one)
```
- **`reponse.json()`**: reads the file **and converts** the JSON into a JavaScript list. (In the navigation we used `.text()` because it was HTML.)
- **`liste.map(creerTemoignage)`**: `map` runs the factory on **each** item of the list and gives back a **new list**. 5 data → 5 `<figure>`.
- **`...temoignages`** (the 3 dots = *spread*): "unpack" the list, like emptying a bag onto the table.
- **If fetch fails** (`catch` → `return`): the review written in the HTML stays visible. Nothing breaks.

### Lines 61–88: the dots and `afficher()`
```js
  let index = 0;                    // which review is shown (0 = the first)
  let pauseUtilisateur = false;     // did the user click "Pause"?

  const points = temoignages.map(function (temoignage, i) {   // one dot per review
    const point = document.createElement("button");
    point.type = "button";
    point.className = "carousel-dot";                         // same style as the carousel dots
    point.setAttribute("aria-label", "Témoignage " + (i + 1) + " sur " + temoignages.length);
    point.addEventListener("click", function () {
      afficher(i);                                            // click on dot 3 → show review 3
    });
    zonePoints.appendChild(point);
    return point;
  });

  function afficher(nouvelIndex) {
    index = (nouvelIndex + temoignages.length) % temoignages.length;  // loop: after the last → back to the first
    temoignages.forEach(function (temoignage, i) {
      temoignage.classList.toggle("is-active", i === index); // fondu en CSS
    });
    points.forEach(function (point, i) {
      if (i === index) {
        point.setAttribute("aria-current", "true");          // the current dot (filled in CSS)
      } else {
        point.removeAttribute("aria-current");
      }
    });
  }
```
- **The `%` (modulo) = the rest of a division.** It makes the reviews **loop**. With 5 reviews:
  - after review 4 (the 5th): `(5 + 5) % 5 = 0` → back to the **first** 🔁
  - before review 0: `(-1 + 5) % 5 = 4` → goes to the **last**
- **`classList.toggle("is-active", i === index)`**: add `is-active` **if** the condition is true, **remove** it otherwise. Only one review has it. **The JS only switches a class; the CSS does the fade.**

### Lines 90–102: start and stop the automatic scroll
```js
  function demarrer() {
    if (minuteur || pauseUtilisateur) return;  // already running, or the user paused → do nothing
    minuteur = setInterval(function () {
      afficher(index + 1);                     // every 6 seconds: next review
    }, DELAI);
    // Pendant le défilement automatique, on n'annonce pas chaque changement
    scene.setAttribute("aria-live", "off");
  }

  function mettreEnPause() {
    arreterDefilement();
    scene.setAttribute("aria-live", "polite"); // when paused, screen readers can read the review
  }
```
- **`setInterval(fonction, 6000)`**: "run this function **every** 6000 ms", like an **alarm clock that rings every 6 seconds** ⏰. `clearInterval` turns it off.
- (Don't confuse with `setTimeout`, which runs **once** after a delay.)

### Lines 104–141: the Pause button and automatic pauses
```js
  function mettreAJourBouton() {
    boutonPause.textContent = pauseUtilisateur ? "Lecture" : "Pause";   // condition ? if true : if false
    boutonPause.setAttribute("aria-label", pauseUtilisateur
      ? "Reprendre le défilement des témoignages"
      : "Mettre en pause le défilement des témoignages");
  }

  // Bouton Pause / Lecture
  boutonPause.addEventListener("click", function () {
    pauseUtilisateur = !pauseUtilisateur;      // ! = the opposite: true ↔ false
    mettreAJourBouton();
    if (pauseUtilisateur) {
      mettreEnPause();
    } else {
      demarrer();
    }
  });

  // Pause automatique pendant qu'on lit (souris dessus ou focus clavier)
  section.addEventListener("mouseenter", mettreEnPause);   // mouse enters → pause
  section.addEventListener("mouseleave", demarrer);        // mouse leaves → restart
  section.addEventListener("focusin", mettreEnPause);      // keyboard enters → pause
  section.addEventListener("focusout", function (event) {
    if (!section.contains(event.relatedTarget)) demarrer(); // keyboard leaves the section → restart
  });

  // Animations réduites demandées : pas de défilement automatique
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pauseUtilisateur = true;
  }

  mettreAJourBouton();
  afficher(0);                                 // show the first review
  if (pauseUtilisateur) {
    scene.setAttribute("aria-live", "polite");
  } else {
    demarrer();                                // start the 6-second alarm clock
  }
}
```
- **`condition ? A : B`** (ternary): a short "if / else" on one line.
- **Accessibility:** it pauses while you're **reading** (mouse or keyboard on it), there's a **Pause button**, and it doesn't scroll at all for people who asked their system for **fewer animations** (`prefers-reduced-motion`).

### The fade effect: the CSS (`css/style.css` lines 1140–1160)
```css
/* Tous les témoignages dans la même case de grille : ils se superposent */
.testimonial-stage {
  display: grid;
  max-width: 760px;
}

.testimonial {
  grid-area: 1 / 1;          /* ALL reviews in the SAME cell → stacked on top of each other */
  margin: 0;
  opacity: 0;                /* invisible by default */
  visibility: hidden;
  transition: opacity 0.8s ease, visibility 0.8s;   /* the change takes 0.8 s = the fade */
}

.testimonial.is-active {     /* only the active one... */
  opacity: 1;                /* ...is visible */
  visibility: visible;
}
```
**Like you're five:** the 5 reviews are **5 transparent sheets stacked in the same frame** 🖼️. Only one is "lit up". When the JS moves `is-active` to the next one, the old one **fades out** and the new one **fades in** at the same time, in 0.8 s. That's the **transition effect**.

## 🧩 Summary in 5 steps
1. `fetch` reads `temoignages.json`, and `.json()` turns it into a JS list.
2. `map` + `createElement` build one `<figure>` per review and put them all on the stage.
3. `afficher(index)` moves the `is-active` class; `%` makes it loop.
4. `setInterval` calls `afficher(index + 1)` every 6 seconds.
5. The CSS stacks the reviews and fades them with `opacity` + `transition`.

## 🇫🇷 À dire
> « Les témoignages sont stockés dans un fichier JSON. Le JavaScript le lit avec `fetch`, puis `reponse.json()` le transforme en liste. Pour chaque témoignage, on crée le HTML avec `createElement`. Toutes les 6 secondes, grâce à `setInterval`, la fonction `afficher` passe la classe `is-active` au témoignage suivant, et le modulo permet de revenir au premier après le dernier. L'effet de fondu est fait en CSS : les témoignages sont superposés dans la même case de grille, et seul celui qui a `is-active` a une opacité de 1, avec une transition de 0,8 seconde. Le défilement se met en pause au survol, au clavier, ou avec le bouton Pause. »

## ❓ Questions possibles
- **Why a JSON file and not the HTML?** To separate the **data** from the **code**: adding a review = editing the JSON only.
- **Difference between `setInterval` and `setTimeout`?** `setInterval` repeats every X ms; `setTimeout` runs once.
- **What does `%` do?** It gives the rest of a division, so the index goes back to 0 after the last review.
- **What if the JSON can't be loaded?** The `catch` stops the function and the review written in the HTML stays visible.
- **Who does the fade, the JS or the CSS?** The CSS. The JS only moves the `is-active` class.
- **Why `arreterDefilement()` at the start?** With the dynamic navigation, you can leave the home page and come back. Without it, there would be **two** timers running at the same time.

## 🎬 Demo
1. Wait 6 seconds on the home page: the review fades to the next one.
2. Put the mouse on it: it stops. Click **Pause**, then **Lecture**.
3. **F12** → **Network**: show the request for `temoignages.json`.
4. Bonus: open `temoignages.json`, change a sentence, save, refresh: the site shows it.

---

# 3️⃣ Menu dynamique (apparition / disparition au scroll)

**File:** `js/en-tete.js` lines 73–101
**Linked to:** `js/main.js` line 23 · CSS `css/style.css` lines 103–120

## The big idea, like you're five 🙈
The header is **stuck** at the top of the screen. When you **scroll down** (you're reading), it **hides** to leave more room. When you **scroll up** even a little (you want to go somewhere else), it **comes back** straight away. Many news sites and apps do this.

## The CSS first: `css/style.css` lines 103–120
```css
/* En-tête collé en haut de l'écran. Le JS (js/en-tete.js) ajoute
   .is-hidden quand on descend et l'enlève quand on remonte. */
.site-header {
  position: sticky;      /* stays stuck at the top while scrolling */
  top: 0;
  z-index: 15;           /* on top of the content */
  background-color: var(--papier);
  border-bottom: 2px solid var(--encre);
  transition: transform 0.3s ease, box-shadow 0.3s ease;  /* slides smoothly */
}

.site-header.is-scrolled {                       /* once we left the top: small shadow */
  box-shadow: 0 4px 16px rgba(26, 26, 26, 0.08);
}

.site-header.is-hidden {                         /* hidden: moved UP by its own full height */
  transform: translateY(-100%);
}
```
- `translateY(-100%)` = "move it up by 100% of its own height", so it slides **just off the screen**.
- Again: **the JS only adds or removes a class, the CSS does the animation.**

## The JS: `js/en-tete.js` lines 73–101
```js
/* ---------- Menu dynamique au défilement ---------- */
/* On descend : l'en-tête se cache pour laisser la place au contenu.
   On remonte : il réapparaît aussitôt. */
export function initialiserMenuAuScroll() {
  let dernierePosition = window.scrollY;        // where we were last time (in px from the top)

  window.addEventListener("scroll", function () {   // runs EVERY time the page scrolls
    const entete = document.querySelector(".site-header");
    if (!entete) return;

    const position = window.scrollY;            // where we are now
    const ecart = position - dernierePosition;  // positive = going DOWN, negative = going UP

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

    dernierePosition = position;                // remember for the next time
  }, { passive: true });
}
```

### Line by line, like you're five
- **`window.scrollY`**: how many pixels you've scrolled from the top. At the top = 0.
- **`ecart = position - dernierePosition`**: compare **now** with **just before**:
  - was 300, now 350 → `ecart = +50` → you're going **down** ⬇️
  - was 350, now 320 → `ecart = -30` → you're going **up** ⬆️
- **`dernierePosition = position`** at the end: like a **footprint** 👣. Next time, we compare with it.

**The 3 conditions to HIDE** (all needed, `&&` = AND):
1. `ecart > 5`: going **down** by more than 5px. The 5px stops it from shaking on tiny movements.
2. `position > entete.offsetHeight`: we're **below the header's height** (`offsetHeight` = its height in px). At the very top, we always keep it.
3. `!menuOuvert`: the menu is **not** open. We'd never hide a menu the user is using!

**SHOW it again** if (`||` = OR): going **up** by more than 5px, **or** back at the top.

**Safety (`menuOuvert`)**: we don't hide it if:
- the burger menu is open (`.nav-toggle:checked`, the checkbox from the CSS part!);
- the "Catégories" dropdown is open (`.nav-dropdown.is-open`);
- a link in the header has the **keyboard focus** (`document.activeElement` = the element with the focus).

**Other details:**
- `classList.toggle("is-scrolled", position > 10)`: adds the shadow **if** you've scrolled more than 10px, removes it otherwise.
- `{ passive: true }`: tells the browser "this listener will never block the scroll", so scrolling stays **smooth**.
- Called **once** in `main.js` line 23, because the listener is on `window` (it stays when the page content changes). It searches the `.site-header` **each time**, so it always finds the current one, even after a dynamic navigation.

## 🧩 Summary in 4 steps
1. At each scroll, we compare the current position with the previous one.
2. Going down (and not at the top, and no menu open) → add `is-hidden`.
3. Going up, or at the top → remove `is-hidden`.
4. The CSS slides the header with `translateY(-100%)` and a transition.

## 🇫🇷 À dire
> « L'en-tête est en `position: sticky`, donc collé en haut. À chaque défilement, l'événement `scroll` compare la position actuelle, `window.scrollY`, avec la position précédente. Si on descend de plus de 5 pixels et qu'on n'est plus en haut, on ajoute la classe `is-hidden`. En CSS, elle fait `translateY(-100%)` : l'en-tête glisse hors de l'écran. Dès qu'on remonte, on enlève la classe et il revient. On ne le cache jamais si un menu est ouvert ou si le clavier est dedans. »

## ❓ Questions possibles
- **How do you know if the user goes up or down?** We subtract the previous position from the current one: positive = down, negative = up.
- **Why 5 pixels?** So the header doesn't flicker on tiny scrolls.
- **Why not hide it when a menu is open?** The user is using it; it would disappear under their finger or mouse.
- **What is `passive: true`?** It tells the browser the listener won't block scrolling, so it stays smooth.
- **Who does the animation?** The CSS (`transition` + `translateY`). The JS only adds or removes the class.

## 🎬 Demo
1. Open an article and scroll down slowly: the header slides away.
2. Scroll up a tiny bit: it comes back right away, with a small shadow.
3. **F12** → Elements: watch `class="site-header is-hidden"` appear and disappear while you scroll.

---

## 🔗 What links your 3 features (good conclusion)
- **`fetch` + `async/await`**: navigation (reads HTML pages) and testimonials (reads a JSON file).
- **The JS changes a class, the CSS animates**: `is-loading` / `page-entree`, `is-active`, `is-hidden`.
- **They work together**: after a dynamic navigation, `initialiserPage()` restarts the testimonials (and stops the old timer); the scroll menu keeps working because it always looks for the current header.
- **Accessibility everywhere**: announcements for screen readers, pause on focus, no hiding a menu in use.
