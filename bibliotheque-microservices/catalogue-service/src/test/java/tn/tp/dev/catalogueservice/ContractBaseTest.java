package tn.tp.dev.catalogueservice;

import io.restassured.module.webtestclient.RestAssuredWebTestClient;
import org.junit.jupiter.api.BeforeEach;

// Classe de base utilisee par les tests generes a partir des contrats.
// On demarre seulement le controleur avec un repository neuf (donnees de depart).
public abstract class ContractBaseTest {

    @BeforeEach
    public void setup() {
        RestAssuredWebTestClient.standaloneSetup(new LivreController(new LivreRepository()));
    }
}
