package tn.tp.dev.empruntservice;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/emprunts")
public class EmpruntController {

    private final RestTemplate restTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final List<Emprunt> emprunts = new ArrayList<>();
    private Long compteur = 1L;

    public EmpruntController(RestTemplate restTemplate, RabbitTemplate rabbitTemplate) {
        this.restTemplate = restTemplate;
        this.rabbitTemplate = rabbitTemplate;
    }

    @GetMapping
    public List<Emprunt> getAllEmprunts() {
        return emprunts;
    }

    // Body attendu : { "livreId": "1", "utilisateur": "ranim" }
    @PostMapping
    public ResponseEntity<?> emprunter(@RequestBody Emprunt demande) {
        Livre livre;
        try {
            // 1) Appel SYNCHRONE (REST) vers catalogue-service, trouve grace a Eureka
            livre = restTemplate.exchange(
                    "http://catalogue-service/livres/" + demande.getLivreId() + "/emprunter",
                    org.springframework.http.HttpMethod.PUT, null, Livre.class).getBody();
        } catch (HttpClientErrorException.Conflict e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur", "Livre non disponible"));
        } catch (HttpClientErrorException.NotFound e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", "Livre introuvable"));
        }

        // 2) Enregistrer l'emprunt
        Emprunt emprunt = new Emprunt(compteur++, demande.getLivreId(), demande.getUtilisateur(), LocalDate.now());
        emprunts.add(emprunt);

        // 3) Envoi ASYNCHRONE d'un message dans RabbitMQ (notification-service le recevra)
        String message = "Bonjour " + emprunt.getUtilisateur() + ", vous avez emprunte le livre \""
                + livre.getTitre() + "\" le " + emprunt.getDateEmprunt() + ".";
        rabbitTemplate.convertAndSend(RabbitConfig.QUEUE, message);

        return ResponseEntity.status(HttpStatus.CREATED).body(emprunt);
    }
}
