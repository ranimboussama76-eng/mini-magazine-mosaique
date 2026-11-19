# Fiche de révision : Bibliothèque intelligente en microservices

> Sujet 3 : gérer un catalogue de livres et des emprunts, avec une notification automatique à chaque emprunt.

---

## 1. Vue d'ensemble (à savoir dessiner au tableau)

```
                         ┌───────────────────────┐
                         │   discovery-server    │  8761  (Eureka = "l'annuaire")
                         └───────────▲───────────┘
             tous les services s'y enregistrent (nom + adresse)
                                     │
  Client          ┌──────────────────┴──────────────────┐
 (Postman) ─────► │            api-gateway   8888        │  vérifie le JWT (Spring Security)
                  └──┬──────────┬───────────┬─────────┬─┘
                     │          │           │         │
             (public)│          │           │         │
                     ▼          ▼           ▼         ▼
             auth-service  catalogue-   emprunt-   notification-
                8081        service     service      service
             (crée JWT)      8082        8083         8084
                           (WebFlux)       │            ▲
                               ▲           │            │
                               │  REST     │            │
                               └─SYNCHRONE─┘            │
                                           │            │
                                           └──► RabbitMQ ┘
                                             ASYNCHRONE
                                         (file "emprunt-queue")
```

| Microservice | Port | Rôle | Techno clé |
|---|---|---|---|
| discovery-server | 8761 | Annuaire des services | Eureka Server |
| api-gateway | 8888 | Porte d'entrée unique + sécurité | Spring Cloud Gateway + Spring Security JWT |
| auth-service | 8081 | Login et génération du token | JJWT |
| catalogue-service | 8082 | Livres et stock | **WebFlux** (Mono / Flux) + **test de contrat** |
| emprunt-service | 8083 | Créer un emprunt | RestTemplate `@LoadBalanced` + RabbitMQ (producteur) |
| notification-service | 8084 | Envoyer les notifications | RabbitMQ (consommateur) |

---

## 2. Le scénario complet, étape par étape

1. **Login** : `POST /auth-service/auth/login` → la Gateway laisse passer (route publique) → auth-service vérifie le mot de passe et renvoie un **token JWT**.
2. Le client met ce token dans l'en-tête : `Authorization: Bearer <token>`.
3. **Emprunt** : `POST /emprunt-service/emprunts` → la Gateway **vérifie la signature du token**. Elle répond 401 si le token est absent ou faux.
4. La Gateway demande à **Eureka** où se trouve `emprunt-service` et lui transmet la requête.
5. emprunt-service appelle **catalogue-service** en **REST synchrone** : `PUT /livres/{id}/emprunter`. Il **attend la réponse**.
   - 200 → stock − 1
   - 409 → livre non disponible (stock = 0)
   - 404 → livre inexistant
6. Si c'est OK, emprunt-service enregistre l'emprunt et **dépose un message dans RabbitMQ** (`emprunt-queue`), puis répond **tout de suite** au client (201).
7. notification-service, qui **écoute** la file, reçoit le message **plus tard** (asynchrone) et envoie la notification (affichée dans la console + visible via `GET /notifications`).

---

## 3. Chaque connexion expliquée

### a) Microservice ↔ Eureka (enregistrement)
- Dépendance `spring-cloud-starter-netflix-eureka-client` + dans `application.yml` :
  ```yaml
  eureka:
    client:
      service-url:
        defaultZone: http://localhost:8761/eureka/
  ```
- Au démarrage, le service s'enregistre **sous le nom de `spring.application.name`**.
- Le serveur Eureka a `register-with-eureka: false` et `fetch-registry: false`, car il ne s'enregistre pas chez lui-même.
- La classe principale du serveur porte `@EnableEurekaServer`.

### b) Gateway → microservices (routage)
- `discovery.locator.enabled: true` crée **automatiquement** une route pour chaque service connu d'Eureka (comme au TP3).
- Format de l'URL : `http://localhost:8888/<nom-du-service>/<chemin>`
  - ex. `http://localhost:8888/catalogue-service/livres` → `catalogue-service:8082/livres`
- `lower-case-service-id: true` permet d'écrire le nom en minuscules.

### c) Sécurité JWT (auth-service + gateway)
- Un **JWT** est un texte en 3 parties `header.payload.signature`. Le payload contient le nom de l'utilisateur (`sub`) et la date d'expiration (`exp`).
- **auth-service** *fabrique* le token et le **signe** avec une clé secrète (algorithme HS256).
- **api-gateway** *vérifie* la signature avec **la même clé secrète** (`jwt.secret` dans les deux `application.yml`).
- Les règles sont dans `SecurityConfig` de la Gateway :
  - `/auth-service/**` → `permitAll()` (sinon personne ne pourrait se connecter)
  - tout le reste → `authenticated()`
- Avantage : la sécurité est **centralisée** dans la Gateway, et les autres services n'ont rien à faire.

### d) emprunt-service → catalogue-service (synchrone / REST)
```java
@Bean @LoadBalanced
public RestTemplate restTemplate() { return new RestTemplate(); }

restTemplate.exchange("http://catalogue-service/livres/1/emprunter", HttpMethod.PUT, null, Livre.class);
```
- `@LoadBalanced` permet d'écrire **le nom du service** au lieu de `localhost:8082`. Eureka donne l'adresse réelle, et le load balancer répartit la charge entre les instances.
- **Synchrone** : emprunt-service **attend** la réponse avant de continuer, car il **a besoin** de savoir si le livre est disponible.

### e) emprunt-service → notification-service (asynchrone / RabbitMQ)
- **Producteur** (emprunt-service) :
  ```java
  rabbitTemplate.convertAndSend("emprunt-queue", message);
  ```
- **Consommateur** (notification-service) :
  ```java
  @RabbitListener(queues = "emprunt-queue")
  public void recevoir(String message) { ... }
  ```
- **Asynchrone** : emprunt-service **n'attend pas**. Si notification-service est arrêté, les messages **restent dans la file** et seront traités à son redémarrage. L'emprunt ne plante donc pas.
- `@Bean Queue` crée la file dans RabbitMQ si elle n'existe pas.

### f) WebFlux dans catalogue-service
- On utilise `Mono<T>` pour **0 ou 1** élément (`findById`) et `Flux<T>` pour **0 à N** éléments (`findAll`).
- Le modèle est **non bloquant** : un petit nombre de threads gère beaucoup de requêtes, ce qui convient à un catalogue très consulté.
- `.map(...)` transforme le résultat, et `.defaultIfEmpty(404)` gère le cas où le livre n'existe pas.
- Dépendance : `spring-boot-starter-webflux` (Spring Reactive Web), comme au TP7.

### g) Test de contrat (Spring Cloud Contract)
- Un **contrat** décrit précisément « si on envoie *cette* requête, on reçoit *cette* réponse ».
- Les fichiers sont dans `catalogue-service/src/test/resources/contracts/` :
  - `PUT /livres/1/emprunter` → 200 + livre avec `quantite: 2`
  - `PUT /livres/3/emprunter` → 409
- Le plugin `spring-cloud-contract-maven-plugin` **génère automatiquement** les tests JUnit (`ContractVerifierTest`) à partir des contrats.
- `ContractBaseTest` démarre le contrôleur avant chaque test.
- **Intérêt** : si quelqu'un modifie catalogue-service et casse ce dont emprunt-service a besoin, **le build échoue**.
- Le plugin produit aussi un `*-stubs.jar` (un faux catalogue) que le consommateur peut utiliser pour ses propres tests.

---

## 4. Méthode de travail (comme dans les TP)

Pour **chaque** microservice :
1. Aller sur **start.spring.io** : Maven, Java, Group `tn.tp.dev`, Artifact = nom du service, packaging Jar.
2. Ajouter les dépendances :

| Service | Dépendances start.spring.io |
|---|---|
| discovery-server | Spring Web, Eureka Server |
| api-gateway | Gateway, Eureka Discovery Client, OAuth2 Resource Server |
| auth-service | Spring Web, Eureka Discovery Client, Lombok (+ jjwt via mvnrepository) |
| catalogue-service | Spring Reactive Web, Eureka Discovery Client, Lombok, Contract Verifier |
| emprunt-service | Spring Web, Eureka Discovery Client, Spring for RabbitMQ, Lombok |
| notification-service | Spring Web, Eureka Discovery Client, Spring for RabbitMQ, Lombok |

3. Vérifier le `pom.xml` : **Spring Boot 3.3.2**, **Spring Cloud 2023.0.3**, **Java 21**.
4. Créer `application.yml` avec le port, `spring.application.name` et l'adresse Eureka.
5. Écrire le modèle, puis le repository (en mémoire avec une `Map`), puis le contrôleur.
6. Lancer et tester.

### Ordre de démarrage (important)
1. `docker compose up -d` (RabbitMQ)
2. **discovery-server**, puis attendre qu'il soit prêt
3. auth-service, catalogue-service, emprunt-service, notification-service
4. **api-gateway** en dernier
5. Vérifier sur http://localhost:8761 que les 5 services apparaissent.

---

## 5. Tests avec Postman (ou curl)

| # | Requête | Résultat attendu |
|---|---|---|
| 1 | `GET localhost:8888/catalogue-service/livres` (sans token) | **401** |
| 2 | `POST localhost:8888/auth-service/auth/login` body `{"username":"ranim","password":"1234"}` | `{"token":"eyJ..."}` |
| 3 | `GET localhost:8888/catalogue-service/livres` + header `Authorization: Bearer <token>` | liste des 3 livres |
| 4 | `POST localhost:8888/emprunt-service/emprunts` body `{"livreId":"1","utilisateur":"ranim"}` | **201** + l'emprunt |
| 5 | Même requête avec `"livreId":"3"` | **409** « Livre non disponible » |
| 6 | `GET localhost:8888/catalogue-service/livres/1` | `quantite` est passée de 3 à 2 |
| 7 | `GET localhost:8888/notification-service/notifications` | message « Bonjour ranim, vous avez emprunté… » |

L'interface RabbitMQ est sur http://localhost:15672 (guest / guest). On y voit la file `emprunt-queue`.

---

## 6. Questions probables en soutenance

- **Pourquoi une Gateway ?** Elle offre un point d'entrée unique, centralise la sécurité JWT et masque les ports internes.
- **Pourquoi Eureka ?** Les services se trouvent par **nom** et non par adresse fixe. On peut lancer plusieurs instances, et le load balancer les répartit.
- **Synchrone ou asynchrone : pourquoi les deux ?** La disponibilité du livre est nécessaire *avant* de valider l'emprunt, donc l'appel est synchrone. La notification n'est pas nécessaire pour répondre au client, donc elle est asynchrone. L'emprunt marche même si le service de notification est en panne.
- **Pourquoi WebFlux sur le catalogue ?** C'est le service le plus consulté (lectures). Le non-bloquant tient mieux la charge.
- **Différence Mono / Flux ?** Mono = 0..1 élément, Flux = 0..N éléments.
- **Où est vérifié le JWT ?** Dans la Gateway (Spring Security, `oauth2ResourceServer().jwt()`), avec la même clé secrète que auth-service.
- **À quoi sert le test de contrat ?** Il garantit que l'API du producteur (catalogue) respecte ce qu'attend le consommateur (emprunt) sans lancer tout le système.
- **Que se passe-t-il si deux personnes empruntent le dernier exemplaire ?** Le bloc `synchronized (livre)` du catalogue fait que seul le premier passe. Le second reçoit 409.
