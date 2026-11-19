package tn.tp.dev.catalogueservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/livres")
public class LivreController {

    private final LivreRepository repository;

    public LivreController(LivreRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Flux<Livre> getAllLivres() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Livre>> getLivreById(@PathVariable String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<Livre> ajouterLivre(@RequestBody Livre livre) {
        return repository.save(livre);
    }

    // Appele par emprunt-service : diminue le stock de 1 si le livre est disponible
    @PutMapping("/{id}/emprunter")
    public Mono<ResponseEntity<Livre>> emprunter(@PathVariable String id) {
        return repository.findById(id)
                .map(livre -> {
                    synchronized (livre) {
                        if (livre.getQuantite() <= 0) {
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(livre); // 409 : indisponible
                        }
                        livre.setQuantite(livre.getQuantite() - 1);
                        return ResponseEntity.ok(livre);                                   // 200 : OK
                    }
                })
                .defaultIfEmpty(ResponseEntity.notFound().build());                        // 404 : inexistant
    }
}
