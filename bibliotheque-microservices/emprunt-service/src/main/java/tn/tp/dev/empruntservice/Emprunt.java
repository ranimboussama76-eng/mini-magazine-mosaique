package tn.tp.dev.empruntservice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Emprunt {
    private Long id;
    private String livreId;
    private String utilisateur;
    private LocalDate dateEmprunt;
}
