package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SiteBodyEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import fr.croqueurdepommetouraine.demo.repository.SiteBodyRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@AllArgsConstructor
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final SiteBodyRepository siteBodyRepository;
    

    @EventListener(ApplicationReadyEvent.class)
    public void initRoles() {
        try {
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
        } catch (Exception e) {
            logger.warn("Impossible d'initialiser les rôles - tables pas encore prêtes: {}", e.getMessage());
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initSiteBody() {
        try {
            long count = siteBodyRepository.count();
            if (count == 0) {
                logger.info("Initialisation des données de SiteBody");
                SiteBodyEntity siteBody = new SiteBodyEntity();
                siteBody.setTitre("Titre");
                siteBody.setCouleurSecondaire("#4CAF50");
                siteBody.setCouleurPrincipale("#FF9800");
                siteBody.setUrl("mon-site.com");
                siteBodyRepository.save(siteBody);
            } else {
                logger.info("Données de SiteBody déjà initialisées ({} enregistrements)", count);
            }
        } catch (Exception e) {
            logger.warn("Impossible d'initialiser SiteBody - tables pas encore prêtes: {}", e.getMessage());
        }
    }

}
