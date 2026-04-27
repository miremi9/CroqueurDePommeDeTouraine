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
        return ResponseEntity.ok(siteBodyBusiness.getSiteBody());
    }

    /**
     * PUT /site-body
     * Met à jour les informations du site
     */
    @PutMapping
    public ResponseEntity<SiteBodyDAO> updateSiteBody(@RequestBody SiteBodyDAO dao) {
        return ResponseEntity.ok(siteBodyBusiness.updateSiteBody(dao));
    }
}
