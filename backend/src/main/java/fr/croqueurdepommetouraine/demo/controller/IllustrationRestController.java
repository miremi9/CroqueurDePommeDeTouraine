package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.IllustrationDAO;
import fr.croqueurdepommetouraine.demo.business.IllustrationBusiness;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/illustrations")
@RequiredArgsConstructor
public class IllustrationRestController {

    private final IllustrationBusiness illustrationBusiness;

    @PostMapping
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {

        IllustrationDAO illustration = illustrationBusiness.createIllustration(file);
        return ResponseEntity.status(201).body(illustration);

    }

    @GetMapping("/{idIllustration}")
    public ResponseEntity<?> getIllustration(@PathVariable UUID idIllustration) {

        return ResponseEntity.ok(illustrationBusiness.getIllustrationDAOById(idIllustration));

    }

    @GetMapping("/{idIllustration}/file")
    public ResponseEntity<?> getIllustrationFile(@PathVariable UUID idIllustration) throws IOException {

        return ResponseEntity.ok(illustrationBusiness.getIllustrationById(idIllustration));

    }
}
