# Bibliothèque intelligente : mini-projet microservices (Sujet 3)

ING-A2-GL · TP Développement Avancé · 2026-2027

Spring Boot 3.3.2 · Spring Cloud 2023.0.3 · Java 21

| Notion demandée | Où ? |
|---|---|
| Microservices Spring Boot + API REST | 6 services |
| Spring Cloud Gateway | `api-gateway` (8888) |
| Eureka Discovery | `discovery-server` (8761) |
| Spring Security JWT | `auth-service` (crée le token) + `api-gateway` (le vérifie) |
| Communication asynchrone (RabbitMQ) | `emprunt-service` → `notification-service` |
| Spring WebFlux | `catalogue-service` |
| Test de contrat | `catalogue-service/src/test/resources/contracts` |

## Lancer

1. Démarrer **RabbitMQ** sur `localhost:5672` (guest / guest).
   - Sans Docker (installé avec Erlang), dans *RabbitMQ Command Prompt (sbin dir)* :

```bash
rabbitmq-service start
```

   - Ou avec Docker : `docker compose up -d`

2. Ensuite, dans IntelliJ, lancez dans l'ordre : `discovery-server` → les 4 services → `api-gateway`.

Ou en ligne de commande :

```bash
mvn clean package
```

```bash
java -jar discovery-server/target/discovery-server-0.0.1-SNAPSHOT.jar
```

(puis de même pour chaque service, la gateway en dernier)

Explications complètes et tests : voir **[FICHE.md](FICHE.md)**.
