package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SiteBodyEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import fr.croqueurdepommetouraine.demo.repository.SiteBodyRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            // Rôles provenant de la constante ROLES
            Set<String> roles = ROLES.ALL_ROLES;
            for (String r : roles) {
                roleRepository.findByNomRole(r).orElseGet(() -> {
                    logger.info("Création du rôle: {}", r);
                    RoleEntity role = new RoleEntity();
                    role.setNomRole(r);
                    return roleRepository.save(role);
                });
            }
        };
    }

    @Bean
    CommandLineRunner initSiteBody(SiteBodyRepository siteBodyRepository) {
        return args -> {
            long count = siteBodyRepository.count();
            if (count == 0) {
                logger.info("Initialisation des données de SiteBody");
                SiteBodyEntity siteBody = new SiteBodyEntity();
                siteBody.setTitre("Titre");
                siteBody.setCouleurSecondaire("#4CAF50");
                siteBody.setCouleurPrincipale("#FF9800");
                siteBodyRepository.save(siteBody);
            } else {
                logger.info("Données de SiteBody déjà initialisées ({} enregistrements)", count);
            }
        };
    }

}
