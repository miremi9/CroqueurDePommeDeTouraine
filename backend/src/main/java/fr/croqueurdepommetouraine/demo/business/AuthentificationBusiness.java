package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.erreurs.RequeteIncorrect;
import fr.croqueurdepommetouraine.demo.security.JwtUtils;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@Transactional
@AllArgsConstructor
public class AuthentificationBusiness {
    private final AuthenticationManager authenticationManager;
    private final UserBusiness userDetailsService;
    private final JwtUtils jwtUtil;

    public String login(String nom, String motDePasse) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(nom, motDePasse));
        } catch (Exception ex) {
            System.out.println(ex.getMessage());
            throw new RequeteIncorrect("Nom d'utilisateur ou mot de passe incorrect");
        }
        final UserEntity user = userDetailsService.getUserByNom(nom);
        final String jwt = jwtUtil.generateToken(user);
        return jwt;
    }
}
