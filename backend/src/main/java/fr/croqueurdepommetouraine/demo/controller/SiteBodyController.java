package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.SiteBodyDAO;
import fr.croqueurdepommetouraine.demo.business.SiteBodyBusiness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/site-body")
public class SiteBodyController {

    @Autowired
    private SiteBodyBusiness siteBodyBusiness;

    /**
     * GET /site-body
     * Récupère les informations du site (titre, couleurs, logo, etc.)
     */
    @GetMapping
    public ResponseEntity<SiteBodyDAO> getSiteBody() {
        SiteBodyDAO dao = siteBodyBusiness.getSiteBody();
        if (dao == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dao);
    }

    /**
     * PUT /site-body
     * Met à jour les informations du site
     */
    @PutMapping
    public ResponseEntity<SiteBodyDAO> updateSiteBody(@RequestBody SiteBodyDAO dao) {
        SiteBodyDAO updated = siteBodyBusiness.updateSiteBody(dao);
        return ResponseEntity.ok(updated);
    }
}
