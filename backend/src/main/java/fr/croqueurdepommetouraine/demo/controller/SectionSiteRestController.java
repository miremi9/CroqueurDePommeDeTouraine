package fr.croqueurdepommetouraine.demo.controller;


import fr.croqueurdepommetouraine.demo.DAO.SectionDAO;
import fr.croqueurdepommetouraine.demo.business.SectionSiteBusiness;
import fr.croqueurdepommetouraine.demo.security.JwtUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sections")
@AllArgsConstructor
public class SectionSiteRestController {

    private final SectionSiteBusiness sectionSiteBusiness;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<SectionDAO> createSection(@RequestBody SectionDAO section) {
        SectionDAO created = sectionSiteBusiness.createSection(section);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<SectionDAO>> getAllSections(@RequestHeader(value = "Authorization", required = false) String authHeader) {

        List<SectionDAO> sections = sectionSiteBusiness.getAllSections(authHeader);

        return ResponseEntity.ok(sections); // 200 OK
    }

    @GetMapping("/{id}")
    public ResponseEntity<SectionDAO> getSectionById(@PathVariable Long id,
                                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        SectionDAO section = sectionSiteBusiness.getSectionByIdWithAuth(id, authHeader);
        return ResponseEntity.ok(section); // 200 OK

    }

    @PutMapping("/{id}")
    public ResponseEntity<SectionDAO> updateSection(
            @PathVariable Long id,
            @RequestBody SectionDAO updatedSection) {

        SectionDAO section = sectionSiteBusiness.updateSection(id, updatedSection);
        return ResponseEntity.ok(section);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long id) {
        boolean deleted = sectionSiteBusiness.deleteSection(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}