package tn.tp.dev.empruntservice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Copie du modele Livre de catalogue-service (pour lire sa reponse)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Livre {
    private String id;
    private String titre;
    private String auteur;
    private int quantite;
}
