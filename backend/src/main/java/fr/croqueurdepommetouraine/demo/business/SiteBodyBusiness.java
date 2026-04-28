package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.DAO.SiteBodyDAO;
import fr.croqueurdepommetouraine.demo.Entity.SiteBodyEntity;
import fr.croqueurdepommetouraine.demo.erreurs.NotFoundException;
import fr.croqueurdepommetouraine.demo.repository.SiteBodyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteBodyBusiness {

    private final SiteBodyRepository siteBodyRepository;

    /**
     * Retourne le contenu du site (le premier en base).
     */
    public SiteBodyDAO getSiteBody() {
        List<SiteBodyEntity> entities = siteBodyRepository.findAll();
        if (entities.isEmpty()) {
            throw new NotFoundException("Aucun contenu de site trouvé en base.");
        }
        SiteBodyEntity entity = entities.getFirst();
        if (entity == null) {
            throw new NotFoundException("Aucun contenu de site trouvé en base.");
        }

        return toDAO(entity);
    }

    /**
     * Met à jour le contenu du site.
     */
    @Transactional
    public SiteBodyDAO updateSiteBody(SiteBodyDAO dao) {
        SiteBodyEntity entity = siteBodyRepository.findAll().getFirst();
        if (entity == null) {
            entity = new SiteBodyEntity();
        }

        entity.setTitre(dao.getTitre());
        entity.setBasDePage(dao.getBasDePage());
        entity.setLogo(dao.getLogo());
        entity.setCouleurPrincipale(dao.getCouleurPrincipale());
        entity.setCouleurSecondaire(dao.getCouleurSecondaire());
        entity.setUrl(dao.getUrl());

        SiteBodyEntity saved = siteBodyRepository.save(entity);
        return toDAO(saved);
    }

    /**
     * Mapping Entity → DAO
     */
    private SiteBodyDAO toDAO(SiteBodyEntity entity) {
        SiteBodyDAO dao = new SiteBodyDAO();
        dao.setTitre(entity.getTitre());
        dao.setBasDePage(entity.getBasDePage());
        dao.setLogo(entity.getLogo());
        dao.setCouleurPrincipale(entity.getCouleurPrincipale());
        dao.setCouleurSecondaire(entity.getCouleurSecondaire());
        dao.setUrl(entity.getUrl());
        return dao;
    }
}
