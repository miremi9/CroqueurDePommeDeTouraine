package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.business.UserBusiness;
import fr.croqueurdepommetouraine.demo.security.AuthRequest;
import fr.croqueurdepommetouraine.demo.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthentificationController {
    private final AuthenticationManager authenticationManager;
    private final UserBusiness userDetailsService;
    private final JwtUtils jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getNom(), request.getMotDePasse()));
        } catch (Exception ex) {
            System.out.println(ex.getMessage());
            return ResponseEntity
                    .status(401)
                    .body("Nom d'utilisateur ou mot de passe incorrect");
        }

        final UserEntity user = userDetailsService.getUserByNom(request.getNom());
        final String jwt = jwtUtil.generateToken(user);
        return ResponseEntity.ok(Map.of("token", jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {
            String nom = request.getNom();
            String motDePasse = request.getMotDePasse();
            userDetailsService.registerUser(nom, motDePasse);
            return ResponseEntity.ok("User registered successfully");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(ex.getMessage());
        }
    }

}
