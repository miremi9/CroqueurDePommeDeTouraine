package fr.croqueurdepommetouraine.demo.business;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.ArticleRepository;
import fr.croqueurdepommetouraine.demo.repository.IllustrationRepository;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.tools.ToolsAuthorisationEndPoint;
import fr.croqueurdepommetouraine.demo.transformer.ArticleMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TestArticleBusiness {
    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private ArticleMapper articleMapper;
    @Mock
    private IllustrationRepository illustrationRepository;
    @Mock
    private SectionRepository sectionRepository;
    @Mock
    private UserBusiness userBusiness;
    @Mock
    private ToolsAuthorisationEndPoint toolsAuthorisationEndPoint;

    @InjectMocks
    private ArticleBusiness articleBusiness;

    private List<ArticleDAO> articleDAOs;
    private List<ArticleEntity> articleEntities;

    @BeforeEach
    void setUp() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream isDao = getClass().getClassLoader().getResourceAsStream("article-dao1-test.json");
        articleDAOs = objectMapper.readValue(isDao, new TypeReference<List<ArticleDAO>>() {
        });
        InputStream isEntity = getClass().getClassLoader().getResourceAsStream("article-entity1-test.json");
        articleEntities = objectMapper.readValue(isEntity, new TypeReference<List<ArticleEntity>>() {
        });
    }

    @Test
    void testGetAllArticles() {
        when(articleRepository.findAll()).thenReturn(articleEntities);
        when(articleMapper.toDAO(any())).thenAnswer(invocation -> {
            ArticleEntity entity = invocation.getArgument(0);
            // Associer par idArticle
            return articleDAOs.stream().filter(d -> d.getIdArticle().equals(entity.getIdArticle())).findFirst().orElse(null);
        });
        List<ArticleDAO> result = articleBusiness.getAllArticles();
        assertEquals(articleDAOs.size(), result.size());
        for (int i = 0; i < result.size(); i++) {
            assertEquals(articleDAOs.get(i).getTitle(), result.get(i).getTitle());
        }
    }

    @Test
    void testCreateArticle() {
        // Utilise les données du jeu de test JSON pour cohérence
        ArticleDAO dao = articleDAOs.get(0);
        ArticleEntity entity = articleEntities.get(0);
        UserEntity userEntity = entity.getAuthor();
        SectionSiteEntity section = entity.getSection();

        when(articleMapper.toEntity(dao)).thenReturn(entity);
        when(articleMapper.toDAO(any())).thenReturn(dao);
        when(userBusiness.getUserByNom(dao.getAuthorName())).thenReturn(userEntity);
        when(articleRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(toolsAuthorisationEndPoint.CanWriteSection(any(SectionSiteEntity.class), any(UserEntity.class))).thenReturn(true);
        when(sectionRepository.findById(section.getIdSection())).thenReturn(Optional.of(section));

        ArticleDAO result = articleBusiness.createArticle(dao, dao.getAuthorName());

        assertNotNull(result);
        assertEquals(dao.getTitle(), result.getTitle());
        assertEquals(dao.getIdSection(), result.getIdSection());

        verify(articleRepository).save(any(ArticleEntity.class));
        verify(userBusiness).getUserByNom(dao.getAuthorName());
        verify(toolsAuthorisationEndPoint).CanWriteSection(any(SectionSiteEntity.class), any(UserEntity.class));
    }

    @Test
    void testDeleteArticleNotFound() {
        when(articleRepository.findById(any())).thenReturn(Optional.empty());
        Exception exception = assertThrows(RuntimeException.class, () -> {
            articleBusiness.deleteArticle(UUID.randomUUID(), "AuteurTest", new ArrayList<>());
        });
        assertTrue(exception.getMessage().contains("Article not found"));
    }
}
