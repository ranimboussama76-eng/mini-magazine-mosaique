# JSON : résumé

## 1. What is JSON?

**JSON** (*JavaScript Object Notation*) is a **text format to store and exchange data**. It looks exactly like a JavaScript object, but it's **plain text**.

**Like you're five:** JSON is a **shopping list written on paper** 📝. A JS object is the shopping list **in your head**: you can use it right away. To **keep** it or **send** it, you write it down on paper (text). To **use** it again, you read the paper back into your head.

### The rules
```json
{
  "nom": "Amira K.",
  "age": 20,
  "etudiante": true,
  "notes": [14, 16, 12]
}
```
| Symbol | Meaning |
|---|---|
| `{ }` | an **object**: a group of `"key": value` pairs |
| `[ ]` | an **array** (a list) |
| `"key"` | keys are **always in double quotes** `" "` |
| values | text `"..."`, number `20`, boolean `true` / `false`, array `[ ]`, object `{ }`, or `null` |
| `,` | separates the items (no comma after the last one!) |

⚠️ No comments, no single quotes `' '`, no functions: JSON is **only data**.

---

## 2. The 2 JSON tools in JavaScript

| Code | Direction | Like you're five |
|---|---|---|
| `JSON.stringify(objet)` | object ➡️ **text** | write the list on paper 📝 |
| `JSON.parse(texte)` | **text** ➡️ object | read the paper back into your head 🧠 |

```js
const objet = { aime: true, commentaires: [] };

const texte = JSON.stringify(objet);
// '{"aime":true,"commentaires":[]}'   ← a string (text)

const retour = JSON.parse(texte);
// { aime: true, commentaires: [] }   ← a real object again
retour.aime   // true
```

---

## 3. Where we use JSON in Mosaïque

### 🅰️ Likes and comments: `js/reactions.js` (Personne 2)

**Problem:** `localStorage` can **only store text**. But our likes and comments are an **object**.
**Solution:** JSON to convert in both directions.

```js
const CLE = "mosaique-reactions";

// READ (line 14): text from localStorage → object
function lireReactions() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || {};   // nothing saved yet → empty object {}
  } catch (erreur) {
    return {};                                            // broken text or storage blocked → {}
  }
}

// SAVE (line 22): object → text → localStorage
function enregistrerReactions(toutes) {
  try {
    localStorage.setItem(CLE, JSON.stringify(toutes));
  } catch (erreur) {
    // storage unavailable (private browsing): the site keeps working
  }
}
```

**What is saved** (visible in **F12 → Application → Local Storage → `mosaique-reactions`**):
```json
{
  "article-1": {
    "aime": true,
    "commentaires": [
      { "nom": "Ranim", "texte": "Super article !", "date": "2026-11-16T10:30:00.000Z" }
    ]
  },
  "article-5": { "aime": false, "commentaires": [] }
}
```
- One **object** with one entry per article (the key comes from `data-article="article-1"` in the HTML).
- `aime` = a **boolean** (liked or not).
- `commentaires` = an **array** of **objects** (name, text, date).
- The date is stored as text with `new Date().toISOString()`, because JSON has no "date" type.

### 🅱️ Testimonials: `data/temoignages.json` + `js/temoignages.js` (Personne 1)

Here JSON is a **data file**, like a tiny database:
```json
[
  { "nom": "Amira K.", "role": "Étudiante en informatique", "texte": "Les articles vont droit au but..." },
  { "nom": "Youssef B.", "role": "Lycéen passionné de jeux vidéo", "texte": "..." }
]
```
It's read with `fetch`, and `.json()` does the `JSON.parse` for us:
```js
const reponse = await fetch(url);       // ask for the file
const liste = await reponse.json();     // text → JS array of objects
liste[0].nom                            // "Amira K."
```
**Advantage:** to add a testimonial, you edit the JSON file only: no HTML, no JS. The **data** is separate from the **code**.

---

## 4. Summary table

| | Likes & comments | Testimonials |
|---|---|---|
| Where the JSON is | in `localStorage` (the browser) | in a file `data/temoignages.json` |
| Read with | `JSON.parse(localStorage.getItem(...))` | `fetch(...)` then `reponse.json()` |
| Written with | `localStorage.setItem(..., JSON.stringify(...))` | by hand, in the file |
| Contains | an object (one entry per article) | an array of 5 objects |

---

## 5. ❓ Possible questions

- **What is JSON?** A text format to store and exchange data, with the same syntax as JS objects.
- **Why `JSON.stringify` before `localStorage.setItem`?** `localStorage` only stores text; without it, the object would be saved as `"[object Object]"` and the data would be lost.
- **Why `JSON.parse` after `getItem`?** To turn the text back into an object we can use (`reactions.aime`, `reactions.commentaires.push(...)`).
- **What does `|| {}` do?** The first time, nothing is saved: `getItem` returns `null`, so we use an empty object instead.
- **Why the `try/catch`?** `JSON.parse` crashes if the text is not valid JSON, and `localStorage` can be blocked in private browsing. The `catch` keeps the site working.
- **Difference between `reponse.json()` and `JSON.parse()`?** Same result. `reponse.json()` is used with `fetch` (it reads the answer and parses it); `JSON.parse()` is used on a text we already have.

---

## 6. 🇫🇷 À dire au professeur

> « JSON est un format texte qui sert à stocker et échanger des données. Il ressemble à un objet JavaScript : des paires clé-valeur entre accolades, et des tableaux entre crochets. On l'utilise à deux endroits. Pour les likes et les commentaires, `localStorage` ne peut stocker que du texte : on transforme notre objet en texte avec `JSON.stringify` pour l'enregistrer, et on le retransforme en objet avec `JSON.parse` pour le relire. Pour les témoignages, les données sont dans un fichier `temoignages.json`, lu avec `fetch` et `reponse.json()`. Ça sépare les données du code : pour ajouter un témoignage, il suffit de modifier le fichier JSON. »

## 7. 🎬 Demo
1. Like an article and add a comment.
2. **F12 → Application → Local Storage → `mosaique-reactions`**: show the JSON text.
3. **F12 → Console**, type `JSON.parse(localStorage.getItem("mosaique-reactions"))`: the text becomes an object you can open with ▶.
4. Open `data/temoignages.json` in VS Code to show the testimonials file.
