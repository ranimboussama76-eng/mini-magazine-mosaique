package tn.tp.dev.catalogueservice;

import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class LivreRepository {

    private final Map<String, Livre> livres = new ConcurrentHashMap<>();

    public LivreRepository() {
        livres.put("1", new Livre("1", "Clean Code", "Robert C. Martin", 3));
        livres.put("2", new Livre("2", "Spring in Action", "Craig Walls", 1));
        livres.put("3", new Livre("3", "Le Petit Prince", "Saint-Exupery", 0));
    }

    public Flux<Livre> findAll() {
        return Flux.fromIterable(livres.values());
    }

    public Mono<Livre> findById(String id) {
        return Mono.justOrEmpty(livres.get(id));
    }

    public Mono<Livre> save(Livre livre) {
        livres.put(livre.getId(), livre);
        return Mono.just(livre);
    }
}
