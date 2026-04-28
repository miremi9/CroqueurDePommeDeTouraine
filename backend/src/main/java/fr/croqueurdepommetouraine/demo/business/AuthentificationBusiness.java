package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.erreurs.RequeteIncorrect;
import fr.croqueurdepommetouraine.demo.security.JwtUtils;
import fr.croqueurdepommetouraine.demo.tools.AuthResponse;
import fr.croqueurdepommetouraine.demo.transformer.UserMapper;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@Transactional
@AllArgsConstructor

public class AuthentificationBusiness {
    private final AuthenticationManager authenticationManager;
    private final UserBusiness userDetailsService;
    private final JwtUtils jwtUtil;
    private final UserMapper userMapper;

    public AuthResponse login(String nom, String motDePasse) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(nom, motDePasse));
        } catch (AuthenticationException ex) {
            throw new RequeteIncorrect("Nom d'utilisateur ou mot de passe incorrect");
        }
        final UserEntity user = userDetailsService.getUserByNom(nom);
        AuthResponse authResponse = new AuthResponse();

        authResponse.user = userMapper.toDAO(user);
        authResponse.token = jwtUtil.generateToken(user);
        return authResponse;
    }
}
