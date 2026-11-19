package tn.tp.dev.catalogueservice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Livre {
    private String id;
    private String titre;
    private String auteur;
    private int quantite;   // nombre d'exemplaires disponibles
}
