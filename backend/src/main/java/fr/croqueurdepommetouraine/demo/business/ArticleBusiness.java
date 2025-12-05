package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.ArticleRepository;
import fr.croqueurdepommetouraine.demo.repository.IllustrationRepository;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import fr.croqueurdepommetouraine.demo.tools.ToolsAuthorisationEndPoint;
import fr.croqueurdepommetouraine.demo.transformer.ArticleMapper;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ArticleBusiness {

    private final ArticleRepository articleRepository;
    private final IllustrationRepository illustrationRepository;
    private final UserBusiness userBusiness;
    private final ArticleMapper articleMapper;
    private final ToolsAuthorisationEndPoint toolsAuthorisationEndPoint;
    private final SectionRepository sectionRepository;

    public List<ArticleDAO> getAllArticles() {

        List<ArticleEntity> articles = articleRepository.findAll();
        return articles.stream().map(articleMapper::toDAO).toList();
    }

    public List<ArticleDAO> getRecentArticles(int limit, String authHeader) {
        UserEntity user = toolsAuthorisationEndPoint.getUserFromHeader(authHeader);
        var page = this.articleRepository.findAll(
                PageRequest.of(0, Math.max(1, limit),
                        Sort.by(Sort.Direction.DESC, "DateCreation")));

        return page.get()
                .filter(s -> toolsAuthorisationEndPoint.CanReadSection(s.getSection(), user))
                .filter(s -> s.getSupprimed() == false)
                .map(articleMapper::toDAO)

                .toList();
    }

    public List<ArticleDAO> getArticlesBySection(Long idSection, String authHeader) {

        if (!toolsAuthorisationEndPoint.CanReadThisSection(authHeader, idSection)) {
            throw new IllegalArgumentException("Pas les droits pour lire cette section");
        }
        List<ArticleEntity> articles = articleRepository.findBySection_IdSection(idSection);
        return articles.stream().map(articleMapper::toDAO).toList();
    }


    public ArticleDAO createArticle(ArticleDAO article, String username) {


        ArticleEntity articleEntity = articleMapper.toEntity(article);
        checkArticleValide(articleEntity);
        loadIllustration(articleEntity);
        loadSection(articleEntity);


        articleEntity.setDateCreation(new Date());
        articleEntity.setAuthor(userBusiness.getUserByNom(username));


        if (!toolsAuthorisationEndPoint.CanWriteSection(articleEntity.getSection(), articleEntity.getAuthor())) {
            throw new IllegalArgumentException("Pas les droits pour écrire dans cette section");
        }

        ArticleEntity savedArticle = articleRepository.save(articleEntity);
        return articleMapper.toDAO(savedArticle);
    }

    private void checkArticleValide(ArticleEntity article) {
        if (article.getSection() == null || article.getSection().getIdSection() == null) {
            throw new RuntimeException("Section must be specified for the article.");
        }
        if (article.getTitle() == null || article.getTitle().isBlank()) {
            throw new RuntimeException("Title must be specified for the article.");
        }
    }

    private void loadIllustration(ArticleEntity article) {
        for (IllustrationEntity illustration : article.getPathsImages()) {
            try {
                illustration = illustrationRepository.getReferenceById(illustration.getIdIllustration());
            } catch (RuntimeException e) {
                throw new RuntimeException("Illustration with id " + illustration + " not found.");
            }
        }
    }

    private void loadSection(ArticleEntity article) {
        try {
            SectionSiteEntity section = sectionRepository.getReferenceById(article.getSection().getIdSection());
            article.setSection(section);
        } catch (Exception e) {
            throw new IllegalArgumentException("Section with id " + article.getSection().getIdSection() + " not found");
        }
    }

    public void deleteArticle(UUID idArticle, String username, List<String> roles) {
        Optional<ArticleEntity> article = articleRepository.findById(idArticle);

        if (article.isEmpty()) {
            throw new RuntimeException("Article not found with id: " + idArticle);
        }
        // If l'utilisateur est admin ou moderateur, il peut supprimer n'importe quel article
        if (roles.contains(ROLES.ROLE_ADMIN) || roles.contains(ROLES.ROLE_MODERATOR)) {
            articleRepository.deleteById(idArticle);
            return;
        }
        // Sinon, il ne peut supprimer que ses propres articles
        if (!article.get().getAuthor().getNom().equals(username)) {
            throw new RuntimeException("Access denied: You are not the author of this article.");
        }
        article.get().setSupprime(true);
        articleRepository.save(article.get());
    }

    public ArticleDAO updateArticle(ArticleDAO articleDAO, String username, List<String> roles) {
        if (articleDAO.getIdArticle() == null) {
            throw new RuntimeException("Id de l'article doit être spécifié.");
        }

        Optional<ArticleEntity> existingOpt = articleRepository.findById(articleDAO.getIdArticle());
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Article not found with id: " + articleDAO.getIdArticle());
        }
        ArticleEntity existing = existingOpt.get();

        // Autorisation: admin/modérateur peuvent tout faire, sinon seul l'auteur peut modifier
        if (!(roles.contains(ROLES.ROLE_ADMIN) || roles.contains(ROLES.ROLE_MODERATOR))) {
            if (existing.getAuthor() == null || !existing.getAuthor().getNom().equals(username)) {
                throw new RuntimeException("Access denied: You are not the author of this article.");
            }
        }

        // Transformer et valider
        ArticleEntity toUpdate = articleMapper.toEntity(articleDAO);
        checkArticleValide(toUpdate);
        loadIllustration(toUpdate);
        loadSection(toUpdate);

        // Conserver champs immuables/actuels
        toUpdate.setIdArticle(existing.getIdArticle());
        toUpdate.setDateCreation(existing.getDateCreation());
        toUpdate.setAuthor(existing.getAuthor());
        toUpdate.setSupprime(existing.getSupprime());

        ArticleEntity saved = articleRepository.save(toUpdate);
        return articleMapper.toDAO(saved);
    }

}
