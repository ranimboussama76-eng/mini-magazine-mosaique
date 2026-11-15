# Personne 2 : Carrousel, Validation des formulaires, Likes et commentaires

Your 3 features have something in common: **the user interacts with them directly** (clicks, types, swipes), and two of them are **linked**: the comments form **reuses** the form validation.

| # | Feature | File | Lines |
|---|---|---|---|
| 1 | Carrousel d'images « À la une » | `js/carrousel.js` | 1–78 |
| 2 | Validation des formulaires côté client (avant l'envoi) | `js/formulaires.js` | 1–138 |
| 3 | Simulation de likes et commentaires (localStorage) | `js/reactions.js` | 1–127 |

> ⚠️ **Demo:** open the site with **Live Server** (right-click `index.html` → "Open with Live Server"). The JS is loaded as a **module** (`type="module"`), which doesn't work when you double-click the file.

---

## 0. How all the JavaScript is linked (30-second intro)

**`index.html`, line 15** (the same line is in every page):
```html
<script type="module" src="js/main.js"></script>
```
Only **one** file is loaded: `main.js`, the **conductor** 🎼.

**`js/main.js`**:
```js
/* Lines 9–16: bring in the functions from the other files */
import { initialiserFormulaire, initialiserCompteur } from "./formulaires.js";  // ← your feature 2
import { initialiserCarrousel } from "./carrousel.js";                         // ← your feature 1
import { initialiserReactions } from "./reactions.js";                         // ← your feature 3
...

/* Line 19: adds class="js" on <html> → tells the CSS "JavaScript is working" */
document.documentElement.classList.add("js");

/* Lines 29–42: run on every page */
function initialiserPage() {
  ...
  initialiserCarrousel();                                         // ← feature 1
  initialiserReactions();                                         // ← feature 3
  initialiserCompteur(document.getElementById("message"), 500);   // ← feature 2 (counter)
  initialiserFormulaire(document.querySelector(".contact-form"),  // ← feature 2 (contact)
    "Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 48 heures.");
  initialiserFormulaire(document.querySelector(".newsletter-form"), // ← feature 2 (newsletter)
    "Merci ! Votre inscription à la newsletter est confirmée.");
  ...
}
```
**Like you're five:** `main.js` is the **remote control** 📺. `import` = "go get that function in that file"; `export` (in the other files) = "this function can be borrowed".

Every feature starts with the same safety check:
```js
const carrousel = document.querySelector(".carousel");
if (!carrousel) return;   // this page has no carousel → stop here, do nothing
```
That's why the **same** `main.js` works on **every** page: each feature only runs where its HTML exists.

🇫🇷 *« Notre JavaScript est découpé en modules : un fichier par fonctionnalité. Le HTML charge seulement `main.js`, qui importe les fonctions avec `import` et les lance. Chaque fonction vérifie d'abord que son élément existe sur la page. »*

---

# 1️⃣ Carrousel d'images « À la une »

**File:** `js/carrousel.js` (lines 1–78)
**Linked to:** `index.html` lines 64–118 · `js/main.js` line 33 · CSS `css/style.css` lines 1041–1132

## The big idea, like you're five 🚂
Imagine a **train with 3 wagons** (the 3 featured articles), side by side, behind a **window** that only shows **one wagon at a time**. To see the next article, we **slide the whole train** to the left. The arrows, the dots, the keyboard and your finger all just say "move the train to wagon number X".

## The HTML: `index.html` lines 64–118
```html
<section class="container carousel" aria-roledescription="carrousel" aria-labelledby="titre-une">
  <div class="carousel-viewport">                    <!-- 🪟 the WINDOW -->
    <div class="carousel-track">                     <!-- 🚂 the TRAIN -->
      <div class="carousel-slide hero" ...>           <!-- 🚃 wagon 1: article 1 -->
        ... image + title + "Lire l'article" ...
      </div>
      <div class="carousel-slide hero" ...> ... </div> <!-- 🚃 wagon 2 -->
      <div class="carousel-slide hero" ...> ... </div> <!-- 🚃 wagon 3 -->
    </div>
  </div>
  <!-- Commandes du carrousel (cachées sans JavaScript) -->
  <div class="carousel-controls">
    <button type="button" class="carousel-btn carousel-prev" aria-label="Article précédent">←</button>
    <div class="carousel-dots"></div>               <!-- empty: the JS creates the dots -->
    <button type="button" class="carousel-btn carousel-next" aria-label="Article suivant">→</button>
    <p class="visually-hidden carousel-status" aria-live="polite"></p>  <!-- read aloud for blind users -->
  </div>
</section>
```

## The CSS: `css/style.css`
```css
.carousel-viewport {
  overflow: hidden; /* cache les diapositives à gauche et à droite */   /* 🪟 the window hides the other wagons */
}

/* Les diapositives sont côte à côte ; le JS décale la piste avec translateX */
.carousel-track {
  display: flex;                    /* wagons side by side, in a row */
  transition: transform 0.5s ease;  /* the train slides smoothly in 0.5 s */
}

.carousel-slide {
  flex: 0 0 100%;                   /* each wagon = 100% of the window's width, never shrinks */
  min-width: 0;
}

/* Sans JavaScript : articles l'un sous l'autre, pas de commandes */
:root:not(.js) .carousel-track {    /* if <html> does NOT have class "js" (from main.js line 19)... */
  flex-direction: column;           /* ...the 3 articles are shown one under the other */
  gap: 48px;
}

:root:not(.js) .carousel-controls,
:root:not(.js) .testimonial-controls {
  display: none;                    /* ...and the arrows/dots are hidden (they wouldn't work) */
}
```
Same trick as the zoom in the CSS part: **`overflow: hidden`** hides what goes outside the frame.

## The JS, piece by piece

### Lines 6–15: find the elements
```js
export function initialiserCarrousel() {
  const carrousel = document.querySelector(".carousel");
  if (!carrousel) return;                                     // no carousel on this page → stop

  const piste = carrousel.querySelector(".carousel-track");   // the train
  const diapos = carrousel.querySelectorAll(".carousel-slide"); // ALL the wagons (a list of 3)
  const zonePoints = carrousel.querySelector(".carousel-dots");
  const statut = carrousel.querySelector(".carousel-status");
  const total = diapos.length;                                // 3
  let index = 0;                                              // the wagon shown now (0 = the first)
```
- `querySelector` = find **the first** element; `querySelectorAll` = find **all** of them.
- Counting starts at **0**: article 1 = index 0, article 2 = index 1, article 3 = index 2.

### Lines 17–29: create one dot per article
```js
  // Un point par diapositive, pour aller directement à un article
  const points = [];
  diapos.forEach(function (diapo, i) {           // for each wagon (i = 0, 1, 2)...
    const point = document.createElement("button");  // ...create a <button>
    point.type = "button";
    point.className = "carousel-dot";
    point.setAttribute("aria-label", "Afficher l'article " + (i + 1) + " sur " + total);
    point.addEventListener("click", function () {
      afficher(i, true);                         // click on dot 2 → go to wagon 2
    });
    zonePoints.appendChild(point);               // put the dot in the dots zone
    points.push(point);                          // remember it in the list
  });
```
The dots are **created by JS**, so if you add a 4th article in the HTML, a 4th dot appears automatically.

### Lines 31–50: `afficher()`, the function that does everything ⭐
```js
  // annoncer = false au chargement : on ne lit pas « 1 sur 3 » sans raison
  function afficher(nouvelIndex, annoncer) {
    // Boucle : après le dernier article on revient au premier, et inversement
    index = (nouvelIndex + total) % total;
    piste.style.transform = "translateX(" + (-index * 100) + "%)";   // 🚂 slide the train

    diapos.forEach(function (diapo, i) {
      // inert : les liens des diapositives cachées ne reçoivent pas le focus
      diapo.inert = i !== index;
    });
    points.forEach(function (point, i) {
      if (i === index) {
        point.setAttribute("aria-current", "true");   // this dot = the current one (filled in CSS)
      } else {
        point.removeAttribute("aria-current");
      }
    });

    if (annoncer) statut.textContent = "Article " + (index + 1) + " sur " + total;  // read aloud
  }
```

**① The loop with `%` (modulo = the rest of a division)**, with `total = 3`:
| You ask for | Calculation | Result |
|---|---|---|
| next after article 3 (index 3) | (3 + 3) % 3 | **0** → back to article 1 🔁 |
| previous before article 1 (index −1) | (−1 + 3) % 3 | **2** → goes to article 3 |
| article 2 (index 1) | (1 + 3) % 3 | **1** → unchanged |

We add `total` before `%` so the result is never negative.

**② Sliding the train with `translateX`:**
| index | Calculation | Result |
|---|---|---|
| 0 | -0 × 100 | `translateX(0%)` → wagon 1 in the window |
| 1 | -1 × 100 | `translateX(-100%)` → train moved 1 wagon left → wagon 2 |
| 2 | -2 × 100 | `translateX(-200%)` → wagon 3 |

The `transition: transform 0.5s` in the CSS makes it **slide** instead of jumping.

**③ `inert`**: the hidden wagons become "asleep": you can't reach their links with **Tab**. Otherwise a keyboard user could land on an invisible link.

**④ The `statut` zone** has `aria-live="polite"`: when its text changes, screen readers read "Article 2 sur 3".

### Lines 52–63: arrows and keyboard
```js
  carrousel.querySelector(".carousel-prev").addEventListener("click", function () {
    afficher(index - 1, true);                  // ← previous
  });
  carrousel.querySelector(".carousel-next").addEventListener("click", function () {
    afficher(index + 1, true);                  // → next
  });

  // Flèches du clavier quand le focus est dans le carrousel
  carrousel.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") afficher(index - 1, true);   // ← key on the keyboard
    if (event.key === "ArrowRight") afficher(index + 1, true);  // → key on the keyboard
  });
```
- `event.key` = the name of the key that was pressed.

### Lines 65–77: finger swipe on phones 👆
```js
  // Glissement du doigt sur téléphone (au moins 50 px)
  let departX = null;
  piste.addEventListener("touchstart", function (event) {
    departX = event.touches[0].clientX;          // where the finger TOUCHED the screen (x position)
  }, { passive: true });
  piste.addEventListener("touchend", function (event) {
    if (departX === null) return;
    const ecart = event.changedTouches[0].clientX - departX;  // where it LEFT minus where it started
    if (Math.abs(ecart) > 50) afficher(ecart < 0 ? index + 1 : index - 1, true);
    departX = null;
  });

  afficher(0, false);                             // at the start: show article 1, without announcing
}
```
- `clientX` = horizontal position of the finger in pixels.
- `ecart < 0` → the finger moved **left** → **next** article (like turning a page).
- `Math.abs(ecart) > 50` → `Math.abs` removes the minus sign; we only react if the finger moved **more than 50px** (otherwise it's just a tap).
- `condition ? A : B` = a short if/else.

## 🧩 Summary in 5 steps
1. The 3 articles are side by side (`flex`) in a window that hides the others (`overflow: hidden`).
2. The JS creates one dot per article.
3. `afficher(index)` slides the track with `translateX(-index × 100%)`; the CSS transition animates it.
4. `%` makes it loop (after the last → the first).
5. Arrows, dots, keyboard ← → and finger swipe all call `afficher()`.

## 🇫🇷 À dire
> « Le carrousel affiche les articles à la une. En CSS, les diapositives sont côte à côte avec `flex`, dans une fenêtre en `overflow: hidden`. Le JavaScript crée un point par article, puis la fonction `afficher` décale la piste avec `translateX` : -100 % pour le deuxième article, -200 % pour le troisième. Le modulo permet de boucler : après le dernier, on revient au premier. On peut changer d'article avec les flèches, les points, le clavier, ou en glissant le doigt sur téléphone. Sans JavaScript, les articles s'affichent simplement l'un sous l'autre. »

## ❓ Questions possibles
- **How does the carousel move?** The JS changes `transform: translateX(...)` on the track; the CSS `transition` animates it.
- **What does `%` do?** It gives the rest of a division, so the index loops from the last article back to the first.
- **What happens without JavaScript?** `main.js` doesn't add the `js` class, so the CSS shows the articles one under the other and hides the controls.
- **What is `inert` for?** It stops the keyboard from reaching links in the hidden slides.
- **How does the swipe work?** We save the finger's x position at `touchstart`, compare it at `touchend`, and change the slide if it moved more than 50px.

## 🎬 Demo
1. Click → and ←, then a dot.
2. Click inside the carousel and use the **← → keys** of the keyboard.
3. Go past the 3rd article: it loops back to the 1st.
4. **F12** → phone mode → swipe with the mouse (drag): it changes slide.
5. Bonus: **F12** → Elements, watch `style="transform: translateX(-100%)"` change on `.carousel-track`.

---

# 2️⃣ Validation des formulaires côté client (avant l'envoi)

**File:** `js/formulaires.js` (lines 1–138)
**Used by:** the **contact** form (`pages/contact.html` lines 86–116), the **newsletter** (`index.html`, near line 293) and the **comments** (`pages/article-X.html`)
**Linked to:** `js/main.js` lines 36–40 · `js/reactions.js` lines 113–123 · CSS `css/style.css` lines 914–962

## The big idea, like you're five 👮
Before a letter goes to the post office, someone **checks the envelope**: is there a name? Is the address correct? Is there a stamp? If something's wrong, they give it **back to you right away** with a note saying what to fix.

That's **client-side validation**: the **browser** (the "client") checks the form **before sending it** to the server. The user sees their mistakes **immediately**, in red, under the field.

⚠️ **Important for the professor:** client-side validation is for **comfort** (fast feedback), **not for security**: someone could turn off JavaScript. The server (PHP, week 3) must **check again**.

## The HTML: `pages/contact.html` lines 86–116
```html
<form class="contact-form" method="post">
  <div class="form-field">
    <label for="nom">Nom complet</label>
    <input type="text" id="nom" name="nom" class="input" ...>          <!-- name="nom" -->
  </div>
  <div class="form-field">
    <label for="email">Adresse e-mail</label>
    <input type="email" id="email" name="email" class="input" ...>     <!-- name="email" -->
  </div>
  <select id="sujet" name="sujet" class="input" required> ... </select> <!-- name="sujet" -->
  <textarea id="message" name="message" class="input" ...></textarea>  <!-- name="message" -->
  <button type="submit" class="btn">Envoyer le message</button>
</form>
```
👉 **The `name` attribute is the key**: the JS uses `champ.name` to know **which rules** to apply to each field.

## The JS, piece by piece

### Line 6: the regex for the e-mail
```js
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
```
A **regex** (regular expression) is a **pattern** to check the shape of a text. Read it piece by piece:

| Piece | Meaning | In `ranim@gmail.com` |
|---|---|---|
| `^` | start of the text | |
| `[^\s@]+` | one or more characters that are **not** a space or `@` | `ranim` |
| `@` | an `@` | `@` |
| `[^\s@]+` | again, characters without space or `@` | `gmail` |
| `\.` | a dot (the `\` means "a real dot") | `.` |
| `[a-z]{2,}` | at least 2 letters | `com` |
| `$` | end of the text | |
| `i` (after the `/`) | ignore upper/lower case | |

✅ `ranim@gmail.com` · ❌ `ranim@gmail` (no `.com`) · ❌ `ranim gmail.com` (no `@`)

### Lines 8–36: the rules for each field
```js
// Règles de chaque champ : renvoie le message d'erreur, ou "" si tout va bien
export function verifierChamp(champ) {
  const valeur = champ.value.trim();        // what was typed, without spaces at the start/end

  switch (champ.name) {                     // depending on the field's name="..."
    case "nom":
      if (valeur === "") return "Indiquez votre nom.";
      if (valeur.length < 3) return "Le nom doit contenir au moins 3 caractères.";
      if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(valeur)) return "Le nom ne doit contenir que des lettres.";
      return "";                            // "" = no error ✅
    case "email":
      if (valeur === "") return "Indiquez votre adresse e-mail.";
      if (!REGEX_EMAIL.test(valeur)) return "Adresse e-mail invalide (exemple : nom@domaine.com).";
      return "";
    case "sujet":
      if (valeur === "") return "Choisissez un sujet.";   // the first <option> has value=""
      return "";
    case "message":
      if (valeur.length < 20) return "Votre message doit contenir au moins 20 caractères.";
      if (valeur.length > 500) return "Votre message ne doit pas dépasser 500 caractères.";
      return "";
    case "commentaire":                     // ← used by the comments (feature 3)
      if (valeur.length < 3) return "Votre commentaire doit contenir au moins 3 caractères.";
      if (valeur.length > 300) return "Votre commentaire ne doit pas dépasser 300 caractères.";
      return "";
    default:
      return "";                            // a field with no rules → always OK
  }
}
```
**Like you're five:** each field goes to its own **checking counter** 🏪 depending on its name. The counter answers with **a sentence explaining the problem**, or an **empty sentence `""`** meaning "all good".
- **`switch` / `case`**: like several `if`s on the same value. "In the case where the name is `nom`, do this..."
- **`.trim()`**: removes the spaces at the start and end, so "   " counts as empty.
- **`.length`**: the number of characters.
- **`regex.test(texte)`**: `true` if the text matches the pattern.
- **`return`**: gives the answer and **stops** the function. The first problem found is the one shown.
- The name regex `^[a-zA-ZÀ-ÿ' -]+$` = only letters (including accented ones like é, à), apostrophes, spaces and dashes (for names like "Ben-Ali" or "O'Neil").

### Lines 38–59: show (or remove) the error under the field
```js
// Affiche (ou efface si message vide) l'erreur sous un champ
function afficherErreur(champ, message) {
  const idErreur = champ.id + "-erreur";          // e.g. "email-erreur"
  let erreur = document.getElementById(idErreur);

  if (!erreur) {                                  // first time: create the <p>
    erreur = document.createElement("p");
    erreur.id = idErreur;
    erreur.className = "field-error";             // red text (CSS)
    champ.setAttribute("aria-describedby", idErreur);  // links the field to its error (screen readers)
    // Newsletter : le message va sous le formulaire entier
    const parent = champ.closest(".form-field") || champ.closest("form");
    parent.appendChild(erreur);
  }

  erreur.textContent = message;                   // write the error (or "" to erase it)
  if (message) {
    champ.setAttribute("aria-invalid", "true");   // the field is invalid → red border (CSS)
  } else {
    champ.removeAttribute("aria-invalid");
  }
}
```
- The `<p>` is created **only once**, then we just change its text.
- **`aria-describedby`**: a blind user's screen reader reads the error message when they're on the field.
- **`aria-invalid="true"`**: tells screen readers "this field has a mistake", **and** the CSS uses it to color the border.

### Lines 61–71: the green success message
```js
function afficherSucces(formulaire, message) {
  let zone = formulaire.querySelector(".form-success");
  if (!zone) {
    zone = document.createElement("p");
    zone.className = "form-success";              // green box (CSS)
    zone.setAttribute("role", "status");          // read aloud by screen readers
    formulaire.appendChild(zone);
  }
  zone.textContent = message;
}
```

### Lines 73–119: connect everything to the form ⭐
```js
/* quandValide (facultatif) : fonction appelée avec les données du
   formulaire quand tout est correct (ex. : enregistrer un commentaire). */
export function initialiserFormulaire(formulaire, messageSucces, quandValide) {
  if (!formulaire) return;                                   // no form on this page → stop
  const champs = formulaire.querySelectorAll("input, select, textarea");  // all the fields

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

    champs.forEach(function (champ) {                         // check EVERY field
      const message = verifierChamp(champ);
      afficherErreur(champ, message);
      if (message && !premierInvalide) premierInvalide = champ;  // remember the FIRST wrong one
    });

    if (premierInvalide) {                                   // at least one error:
      afficherSucces(formulaire, "");                        //   erase an old success message
      premierInvalide.focus();                               //   put the cursor on the first error
      return;                                                //   STOP, don't send
    }

    if (quandValide) quandValide(new FormData(formulaire));  // all OK: run the extra action (comments)
    afficherSucces(formulaire, messageSucces);               // green message
    formulaire.reset();                                      // empty the form
    // Remet les compteurs de caractères à zéro
    formulaire.querySelectorAll("textarea").forEach(function (zone) {
      zone.dispatchEvent(new Event("input"));
    });
  });
}
```
**The 3 moments of checking:**
| Event | When | What we do |
|---|---|---|
| `blur` | you **leave** a field (click elsewhere / Tab) | check this field |
| `input` | you **type** a letter | re-check **only if** it was already red, so the error disappears as soon as it's fixed |
| `submit` | you click **Envoyer** | check **all** fields |

Key words:
- **`formulaire.noValidate = true`**: turns off the browser's own grey bubbles ("Veuillez remplir ce champ"), to use **our** messages in French, in the design of the site. (Without JS, the `required` attributes in the HTML still give the browser's bubbles: nice fallback.)
- **`event.preventDefault()`**: **stops** the form from being sent (and the page from reloading). In week 3, sending to PHP will happen here.
- **`premierInvalide.focus()`**: puts the cursor **directly** in the first wrong field. Very helpful, and good for accessibility.
- **`quandValide`**: an **optional** function given by whoever uses the form. The contact form doesn't give one. The comments form gives one to **save the comment** (see feature 3). This is how the two files are **linked**.
- **`new FormData(formulaire)`**: collects all the values of the form; we read them with `donnees.get("nom")`.
- **`dispatchEvent(new Event("input"))`**: after `reset()`, we "pretend" someone typed, so the character counter updates back to 0.

### Lines 121–138 (bonus): the character counter
```js
/* Compteur de caractères sous une zone de texte (contact, commentaires) */
export function initialiserCompteur(zoneTexte, maximum) {
  if (!zoneTexte) return;

  const compteur = document.createElement("p");
  compteur.className = "char-count";
  compteur.setAttribute("aria-live", "polite");
  zoneTexte.insertAdjacentElement("afterend", compteur);   // put it right AFTER the textarea

  function mettreAJour() {
    const total = zoneTexte.value.length;
    compteur.textContent = total + " / " + maximum + " caractères";   // "42 / 500 caractères"
    compteur.classList.toggle("is-over", total > maximum);           // red if too long
  }

  zoneTexte.addEventListener("input", mettreAJour);        // at every letter typed
  mettreAJour();
}
```

### The linked CSS: `css/style.css` lines 914–942
```css
/* Messages des formulaires */
.field-error {                       /* the error text: small, terracotta */
  margin-top: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--terracotta);
}

.field-error:empty {                 /* no text inside → hidden (no empty space) */
  display: none;
}

.input[aria-invalid="true"] {        /* a field with aria-invalid="true" → terracotta border + pink background */
  border-color: var(--terracotta);
  background-color: #FDF3F0;
}

.form-success {                      /* the green success box */
  padding: 12px 16px;
  border-left: 3px solid #2E7D4F;
  background-color: #EEF6F0;
  color: #1F5C39;
  ...
}

.form-success:empty {                /* empty → hidden */
  display: none;
}
```
- `[aria-invalid="true"]` is an **attribute selector**: "the `.input` elements whose `aria-invalid` attribute equals `true`". The JS adds the attribute, the CSS colors it.
- `:empty` = an element with **nothing inside**.

## 🧩 Summary in 5 steps
1. `verifierChamp` has the rules for each field (by its `name`) and returns an error message or `""`.
2. `afficherErreur` shows the message under the field and adds `aria-invalid` (red border in CSS).
3. Fields are checked when you **leave** them (`blur`) and live while you fix them (`input`).
4. On `submit`, `preventDefault()` stops the sending; every field is checked; the cursor goes to the first error.
5. If everything is OK: the optional `quandValide` action, a green message, and the form is emptied.

## 🇫🇷 À dire
> « La validation côté client vérifie le formulaire dans le navigateur, avant l'envoi. La fonction `verifierChamp` contient les règles de chaque champ, selon son attribut `name`, avec un `switch`. Par exemple, l'e-mail est vérifié avec une expression régulière. Elle renvoie un message d'erreur, ou une chaîne vide si tout va bien. Le champ est vérifié quand on le quitte, avec l'événement `blur`, puis en direct pendant la correction. À l'envoi, `preventDefault()` bloque l'envoi, on vérifie tous les champs, et le curseur va sur la première erreur. Les erreurs s'affichent en rouge grâce à l'attribut `aria-invalid`. Cette validation est là pour le confort : le serveur PHP devra revérifier en semaine 3. »

## ❓ Questions possibles
- **What's the difference between client-side and server-side validation?** Client = in the browser, fast feedback, but can be bypassed. Server = PHP, the real security. Both are needed.
- **Explain the e-mail regex.** Text without spaces or @, then @, then text, a dot, and at least 2 letters.
- **Why `noValidate`?** To replace the browser's default bubbles with our own messages.
- **What does `preventDefault()` do here?** It stops the form from being sent and the page from reloading.
- **Why `trim()`?** So a field with only spaces counts as empty.
- **What are `blur` and `input`?** `blur` = leaving a field; `input` = each time the content changes.
- **What is `quandValide`?** An optional function (a **callback**) run when the form is valid; the comments use it to save the comment.

## 🎬 Demo
1. On **Contact**, click **Envoyer** with everything empty: all errors appear, the cursor jumps to "Nom".
2. Type `ab` in Nom and click elsewhere: "au moins 3 caractères".
3. Type `ranim@gmail` in e-mail: "Adresse e-mail invalide". Add `.com`: the error disappears **while typing**.
4. Type in the message: the counter "x / 500 caractères" changes.
5. Fill everything correctly and send: green message, and the form empties.

---

# 3️⃣ Simulation de likes et commentaires (localStorage)

**File:** `js/reactions.js` (lines 1–127)
**Present on:** the 10 article pages (`pages/article-1.html` to `article-10.html`), e.g. `pages/article-1.html` lines 109–134
**Linked to:** `js/formulaires.js` (validation, reused) · `js/main.js` line 35 · CSS `css/style.css` lines 1218–1253

## The big idea, like you're five 📒
We don't have a server or a database (that's week 3). So we **simulate** likes and comments by saving them **in the browser itself**, in a little notebook called **`localStorage`**.

`localStorage` is like a **notebook in your browser's drawer** 📒:
- what you write in it **stays** even if you close the tab or the computer;
- but it's **only on this computer, in this browser**. Your friend won't see your comments. That's why it's a **"simulation"**.

## The HTML: `pages/article-1.html` lines 109–134
```html
<!-- Réactions des lecteurs : « J'aime » et commentaires (js/reactions.js).
     Ils sont sauvegardés dans le navigateur avec localStorage. -->
<section class="container reactions" aria-labelledby="titre-reactions" data-article="article-1">
  <!--                                                    ↑ which article this is (different on each page) -->
  <h2 class="reactions-title" id="titre-reactions">Vos réactions</h2>
  <button type="button" class="like-btn" aria-pressed="false" data-likes="48">
    <!--                                                       ↑ fake starting number of likes -->
    <span class="like-icon" aria-hidden="true">♥</span>
    <span class="like-label">J'aime</span>
    <span class="like-count">48</span>
  </button>

  <h3 class="comments-title">Commentaires (<span class="comment-count">0</span>)</h3>
  <p class="comment-empty">Aucun commentaire pour l'instant. Donnez votre avis !</p>
  <ol class="comment-list"></ol>                        <!-- empty: the JS fills it -->

  <form class="comment-form" method="post">
    <input type="text" id="commentaire-nom" name="nom" ...>          <!-- name="nom" → rule "nom" -->
    <textarea id="commentaire-texte" name="commentaire" ...></textarea> <!-- name="commentaire" → rule "commentaire" -->
    <button type="submit" class="btn">Publier le commentaire</button>
  </form>
</section>
```
- **`data-article="article-1"`** and **`data-likes="48"`**: custom attributes. The JS reads them with `section.dataset.article` and `bouton.dataset.likes`.

## How the data is stored
Everything is in **one** key, `"mosaique-reactions"`, as **JSON text**:
```js
{
  "article-1": { "aime": true,  "commentaires": [ { "nom": "Ranim", "texte": "Super !", "date": "2026-11-15T..." } ] },
  "article-5": { "aime": false, "commentaires": [] },
  ...
}
```
Like a notebook with **one page per article**.

## The JS, piece by piece

### Lines 7–26: read and write in the notebook
```js
import { initialiserFormulaire, initialiserCompteur } from "./formulaires.js";  // ← reuse feature 2!

const CLE = "mosaique-reactions";      // the name of our page in the notebook

// Lecture / écriture protégées : localStorage peut être bloqué (navigation privée)
function lireReactions() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || {};   // read the text → turn it into an object
  } catch (erreur) {
    return {};                                            // problem → start with an empty object
  }
}

function enregistrerReactions(toutes) {
  try {
    localStorage.setItem(CLE, JSON.stringify(toutes));    // object → text → save it
  } catch (erreur) {
    // Stockage indisponible : la réaction reste visible jusqu'au rechargement
  }
}
```
**The 4 key tools:**
| Code | Meaning |
|---|---|
| `localStorage.setItem(cle, texte)` | **write** in the notebook |
| `localStorage.getItem(cle)` | **read** from the notebook (`null` if nothing yet) |
| `JSON.stringify(objet)` | object → **text** (localStorage can only store text!) |
| `JSON.parse(texte)` | text → **object** |

- `|| {}`: if nothing is saved yet (`null`), use an empty object instead.
- `try / catch`: in **private browsing**, localStorage can be **blocked**. Instead of crashing, we just continue without saving.

### Lines 28–39: find this article's data
```js
export function initialiserReactions() {
  const section = document.querySelector(".reactions");
  if (!section) return;                         // not an article page → stop

  const idArticle = section.dataset.article;    // "article-1" (from data-article)
  const toutes = lireReactions();               // the whole notebook
  const reactions = toutes[idArticle] || { aime: false, commentaires: [] };  // this article's page, or a blank one

  function sauvegarder() {
    toutes[idArticle] = reactions;              // put this article's page back in the notebook
    enregistrerReactions(toutes);               // save the whole notebook
  }
```
- `toutes[idArticle]` = `toutes["article-1"]`: access a property with a **variable** name.

### Lines 41–56: the "J'aime" button ❤️
```js
  const bouton = section.querySelector(".like-btn");
  const compteur = bouton.querySelector(".like-count");
  const likesDeDepart = Number(bouton.dataset.likes); // nombre fictif écrit dans le HTML  ("48" → 48)

  function afficherLike() {
    compteur.textContent = likesDeDepart + (reactions.aime ? 1 : 0);  // 48, or 49 if I liked it
    bouton.setAttribute("aria-pressed", String(reactions.aime));      // screen readers: "pressed / not pressed"
    bouton.classList.toggle("is-liked", reactions.aime);              // terracotta style (CSS)
  }

  bouton.addEventListener("click", function () {
    reactions.aime = !reactions.aime;   // ! = opposite: like ↔ unlike
    sauvegarder();                      // write it in the notebook
    afficherLike();                     // update the screen
  });
```
- **`Number("48")`**: `data-` attributes are **text**; `Number` turns it into a number so we can **add**. (Otherwise `"48" + 1` would give `"481"`! 😄)
- **`reactions.aime`** is `true` or `false` (a **boolean**). `!` flips it, like a light switch 💡.
- **`aria-pressed`**: tells screen readers it's a **toggle button**, pressed or not.
- The 48 is **fictional**: we only add **your** like (+1). That's the "simulation" part.

### Lines 58–107: show the comments
```js
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
    auteur.textContent = commentaire.nom;                       // the name in bold
    const date = document.createElement("time");
    date.dateTime = commentaire.date;
    date.textContent = new Date(commentaire.date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    });                                                         // "15 novembre à 14:30"
    entete.append(auteur, " · ", date);                         // "Ranim · 15 novembre à 14:30"

    const texte = document.createElement("p");
    texte.className = "comment-text";
    texte.textContent = commentaire.texte;                      // the comment itself

    const supprimer = document.createElement("button");         // the "Supprimer" button
    supprimer.type = "button";
    supprimer.className = "comment-delete";
    supprimer.textContent = "Supprimer";
    supprimer.setAttribute("aria-label", "Supprimer le commentaire de " + commentaire.nom);
    supprimer.addEventListener("click", function () {
      reactions.commentaires.splice(position, 1);  // remove 1 item at this position from the list
      sauvegarder();
      afficherCommentaires();                       // redraw the list
      section.querySelector(".comments-title").focus();  // keyboard focus goes to the title
    });

    element.append(entete, texte, supprimer);
    return element;                                  // the finished <li>
  }

  function afficherCommentaires() {
    liste.replaceChildren(...reactions.commentaires.map(creerCommentaire));  // rebuild the whole list
    nombre.textContent = reactions.commentaires.length;                       // "Commentaires (3)"
    messageVide.hidden = reactions.commentaires.length > 0;                   // hide "Aucun commentaire" if there are some
  }
```
- **🔒 SECURITY (the professor will love this): `textContent`, never `innerHTML`.** If someone writes `<img src=x onerror=alert('hack')>` as a comment:
  - with `innerHTML`, the browser would **run it as code** ❌ (an attack called **XSS**);
  - with `textContent`, it's shown as **plain text** ✅.
- **`map(creerCommentaire)`**: turns each saved comment (data) into an `<li>` (HTML). `map` also gives the **position** (0, 1, 2...) as the second argument, used by "Supprimer".
- **`splice(position, 1)`**: "at this position, remove 1 item" from the list.
- **`replaceChildren(...)`**: empties the list and puts the new items in, in one go. The `...` "unpacks" the list.
- **`hidden`**: an HTML attribute that hides an element.

### Lines 109–127: the comments form → reuses the validation 🔗
```js
  // Le titre peut recevoir le focus après une suppression
  section.querySelector(".comments-title").setAttribute("tabindex", "-1");

  // Le formulaire réutilise la validation du module formulaires.js
  const formulaire = section.querySelector(".comment-form");
  initialiserCompteur(formulaire.querySelector("textarea"), 300);   // counter: "x / 300 caractères"
  initialiserFormulaire(formulaire, "Merci ! Votre commentaire est publié.", function (donnees) {
    // ↑ this function is "quandValide": it only runs if ALL fields are valid
    reactions.commentaires.push({                  // add a new comment at the end of the list
      nom: donnees.get("nom").trim(),
      texte: donnees.get("commentaire").trim(),
      date: new Date().toISOString()               // the date and time now, as text
    });
    sauvegarder();                                 // write it in the notebook
    afficherCommentaires();                        // show it on the page
  });

  afficherLike();          // at the start: show the like state saved before
  afficherCommentaires();  // at the start: show the comments saved before
}
```
**The link between your 2 features** 🔗: we **don't rewrite** any validation here. We call `initialiserFormulaire` from `formulaires.js` and give it a **third argument**: a function that saves the comment. `formulaires.js` checks the fields with its rules (`case "nom"`, `case "commentaire"`), and **only if everything is valid** it calls our function. That's **code reuse**.

- `push(...)`: add an item at the **end** of a list.
- `new Date().toISOString()`: the current date as text, e.g. `"2026-11-15T14:30:00.000Z"`, easy to store.

### The linked CSS: `css/style.css` lines 1218–1253
```css
.like-btn {                          /* round "pill" button */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--bordure);
  border-radius: 999px;              /* very rounded = pill shape */
  ...
}

.like-icon {                         /* the ♥: grey at first */
  color: var(--gris);
  transition: transform 0.2s ease, color 0.2s ease;
}

.like-btn.is-liked {                 /* liked: terracotta button */
  border-color: var(--terracotta);
  background-color: #FDF3F0;
  color: var(--terracotta);
}

.like-btn.is-liked .like-icon {      /* the ♥ turns terracotta and grows a bit */
  color: var(--terracotta);
  transform: scale(1.2);
}
```

## 🧩 Summary in 5 steps
1. All likes and comments are saved in **one localStorage key**, as JSON text (`stringify` to save, `parse` to read).
2. Each article has its own page in the notebook, thanks to `data-article`.
3. The ❤️ button flips `aime` (true/false), saves, and shows 48 or 49 with the `is-liked` style.
4. Comments are built with `createElement` + **`textContent`** (safe against XSS), and can be deleted with `splice`.
5. The comment form **reuses the validation** of `formulaires.js`; the comment is saved only if it's valid.

## 🇫🇷 À dire
> « On n'a pas encore de serveur, donc on simule les likes et les commentaires avec `localStorage`, un petit espace de stockage dans le navigateur qui garde les données même après la fermeture. Comme `localStorage` ne stocke que du texte, on utilise `JSON.stringify` pour enregistrer et `JSON.parse` pour relire. Chaque article a sa propre entrée grâce à l'attribut `data-article`. Le bouton J'aime inverse un booléen et ajoute la classe `is-liked`. Les commentaires sont créés avec `createElement` et `textContent`, jamais `innerHTML`, pour éviter qu'un commentaire contienne du code malveillant. Enfin, le formulaire de commentaire réutilise la validation de `formulaires.js` : le commentaire n'est enregistré que si les champs sont valides. »

## ❓ Questions possibles
- **What is localStorage?** Storage inside the browser that keeps data even after closing it, but only on this computer and this browser.
- **Why `JSON.stringify` and `JSON.parse`?** localStorage only stores text; we convert our object to text to save it, and back to read it.
- **Why "simulation"?** No server: other visitors can't see your likes or comments, and the starting number of likes is fictional.
- **Why `textContent` and not `innerHTML`?** Security: with `innerHTML`, a comment containing HTML/JS code could run (XSS attack).
- **Why `Number(bouton.dataset.likes)`?** `data-` attributes are text; without `Number`, `"48" + 1` would give `"481"`.
- **Why the `try/catch`?** localStorage can be blocked (private browsing); the site keeps working instead of crashing.
- **How is it linked to the validation?** The comment form calls `initialiserFormulaire` with a callback that saves the comment only when the form is valid.

## 🎬 Demo
1. Open an article, click **J'aime**: 48 → 49, the ♥ turns terracotta. **Refresh the page**: it's still liked! 🎉
2. Try to publish an empty comment: the validation errors appear (feature 2!).
3. Write a valid comment: it appears with your name and the date. Refresh: still there.
4. Click **Supprimer**: it disappears.
5. **F12** → **Application** tab → **Local Storage** → you can **see the JSON** saved under `mosaique-reactions`. Very convincing for the professor.
6. Bonus (security): write `<b>bonjour</b>` as a comment: it's shown as text, not in bold.

---

## 🔗 What links your 3 features (good conclusion)
- **The user acts directly**: clicks, typing, finger swipe.
- **`formulaires.js` is reused** by the comments: one validation code, three forms (contact, newsletter, comments).
- **The JS changes a class or an attribute, the CSS does the look**: `aria-current` on the dots, `aria-invalid` on the fields, `is-liked` on the button.
- **Accessibility everywhere**: `aria-live` for the carousel, `aria-describedby` and `focus()` for errors, `aria-pressed` for the like.
