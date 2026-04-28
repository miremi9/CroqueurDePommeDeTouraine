package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.business.AuthentificationBusiness;
import fr.croqueurdepommetouraine.demo.business.UserBusiness;
import fr.croqueurdepommetouraine.demo.security.AuthRequest;
import fr.croqueurdepommetouraine.demo.tools.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthentificationController {
    private final UserBusiness userDetailsService;

    private final AuthentificationBusiness authentificationBusiness;


    // Endpoint pour l'authentification d'un utilisateur
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        AuthResponse authResponse = authentificationBusiness.login(request.getNom(), request.getMotDePasse());
        return ResponseEntity.ok(authResponse);

    }

    // Endpoint pour l'inscription d'un nouvel utilisateur
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {

        String nom = request.getNom();
        String motDePasse = request.getMotDePasse();
        String email = request.getEmail();
        userDetailsService.registerUser(nom, motDePasse, email);
        return ResponseEntity.ok("User registered successfully");

    }

}
