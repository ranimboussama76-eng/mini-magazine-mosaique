package tn.tp.dev.authservice;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    // Utilisateurs en memoire (username -> password)
    private final Map<String, String> users = Map.of(
            "ranim", "1234",
            "admin", "admin"
    );

    @Value("${jwt.secret}")
    private String secret;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String password = users.get(request.getUsername());
        if (password == null || !password.equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("erreur", "Identifiants incorrects"));
        }

        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject(request.getUsername())                                  // a qui appartient le token
                .issuedAt(new Date())                                            // date de creation
                .expiration(new Date(System.currentTimeMillis() + 3600_000))     // valable 1 heure
                .signWith(key, Jwts.SIG.HS256)                                   // signature avec la cle secrete
                .compact();

        return ResponseEntity.ok(Map.of("token", token));
    }
}
