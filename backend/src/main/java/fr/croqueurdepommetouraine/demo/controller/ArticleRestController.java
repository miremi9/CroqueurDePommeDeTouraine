package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.business.ArticleBusiness;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/articles")
@RequiredArgsConstructor
public class ArticleRestController {

    private final ArticleBusiness articleBusiness;


    @GetMapping
    public List<ArticleDAO> getArticles() {

        return this.articleBusiness.getAllArticles();
    }

    @GetMapping("/recents")
    public List<ArticleDAO> getRecentArticles(@RequestParam(value = "limit", required = false, defaultValue = "5") int limit,
                                              @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return this.articleBusiness.getRecentArticles(limit, authHeader);
    }

    @GetMapping("/bySection")
    public ResponseEntity<?> getArticlesBySection(@RequestParam(value = "idSection") Long idSection,
                                                  @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<ArticleDAO> articles = articleBusiness.getArticlesBySection(idSection, authHeader);
            return ResponseEntity.ok(articles);

        } catch (IllegalArgumentException e) {
            // par exemple idSection invalide
            return ResponseEntity
                    .badRequest()
                    .body("Paramètre invalide : " + e.getMessage());

        } catch (NoSuchElementException e) {
            // par exemple section non trouvée dans le business
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Section introuvable : " + e.getMessage());

        } catch (Exception e) {
            // toute autre exception inattendue
            e.printStackTrace(); // log côté serveur pour debug
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur : " + e.getMessage());
        }
    }


    @PostMapping
    public ResponseEntity<?> createArticle(@RequestBody ArticleDAO article) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        article.setDateCreation(Date.from(new Date().toInstant()));
        try {
            return new ResponseEntity<>(this.articleBusiness.createArticle(article, username), HttpStatus.OK);
        } catch (RuntimeException e) {
            Map<String, String> errorBody = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody);
        }

    }

    @DeleteMapping
    public ResponseEntity<String> deleteArticle(@RequestParam(value = "idArticle") UUID idArticle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        try {
            articleBusiness.deleteArticle(idArticle, username, roles);
            return ResponseEntity.ok("Article supprimé avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("{idArticle}")
    public ResponseEntity<?> updateArticle(@PathVariable String idArticle, @RequestBody ArticleDAO article) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        try {
            ArticleDAO updated = this.articleBusiness.updateArticle(article, username, roles);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> errorBody = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

}