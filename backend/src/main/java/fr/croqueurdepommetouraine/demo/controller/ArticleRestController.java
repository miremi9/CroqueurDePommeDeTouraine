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

import java.util.Date;
import java.util.List;
import java.util.UUID;

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
        List<ArticleDAO> articles = articleBusiness.getArticlesBySection(idSection, authHeader);
        return ResponseEntity.ok(articles);

    }


    @PostMapping
    public ResponseEntity<?> createArticle(@RequestBody ArticleDAO article) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        article.setDateCreation(Date.from(new Date().toInstant()));

        return new ResponseEntity<>(this.articleBusiness.createArticle(article, username), HttpStatus.CREATED);


    }

    @DeleteMapping("{idArticle}")
    public ResponseEntity<String> deleteArticle(@PathVariable UUID idArticle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        articleBusiness.deleteArticle(idArticle, username, roles);
        return ResponseEntity.ok("Article supprimé avec succès");

    }

    @PutMapping("{idArticle}")
    public ResponseEntity<ArticleDAO> updateArticle(
            @PathVariable String idArticle,
            @RequestBody ArticleDAO article) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        ArticleDAO updated = articleBusiness.updateArticle(article, username, roles);

        return ResponseEntity.ok(updated);
    }

}