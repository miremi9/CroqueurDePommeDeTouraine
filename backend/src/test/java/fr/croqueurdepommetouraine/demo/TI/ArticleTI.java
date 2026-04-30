package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.TI.tools.ClassicMethods;
import fr.croqueurdepommetouraine.demo.TI.tools.MockPerform;
import fr.croqueurdepommetouraine.demo.repository.ArticleRepository;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest//(properties = "logging.level.org.springframework=DEBUG")
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ArticleTI {
    @MockitoBean
    private JavaMailSender javaMailSender;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private ArticleRepository articleRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockPerform mockPerform;
    @Autowired
    private ClassicMethods classicMethods;
    private static String articleCreateJson;
    private static String articleUpdateJson;


    private String token;
    private Long idSection;

    @BeforeAll
    static void setup() throws IOException {
        articleCreateJson = Files.readString(
                Path.of("src/test/resources/requet/article/create-article.json"));
        articleUpdateJson = Files.readString(
                Path.of("src/test/resources/requet/article/update-article.json"));
    }

    @BeforeEach
    void createAdmin() throws Exception {
        userRepository.deleteAll();
        token = classicMethods.createAdminToken();
        idSection = classicMethods.createSection(token);

    }

    @Test
    void testCreateArticles() throws Exception {

        checkCreateArticle();
        String idArticle = checkGetArticles();
        checkUpdateArticle(idArticle);
        checkWrongUpdateArticle(idArticle);
    }

    private void checkUpdateArticle(String idArticle) throws Exception {
        ArticleDAO articleUpdate = objectMapper.readValue(articleUpdateJson, ArticleDAO.class);
        articleUpdate.setIdArticle(UUID.fromString(idArticle));
        articleUpdate.setIdSection(idSection);
        mockPerform.performRequest(HttpMethod.PUT, "/articles/" + idArticle, token,
                articleUpdate,
                status().isOk());


        // VERIFY UPDATE
        ArticleEntity updated = articleRepository.findById(UUID.fromString(idArticle)).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Titre2");
        assertThat(updated.getContent()).isEqualTo("Contenu2");
    }

    private String checkGetArticles() throws Exception {
        String response = mockPerform.performRequest(HttpMethod.GET, "/articles", token, null, status().isOk(), null);


        JsonNode articleNode = objectMapper.readTree(response).get(0);

        assertThat(articleNode.get("idSection").asLong()).isEqualTo(idSection);
        return articleNode.get("idArticle").asText();
    }

    private void checkCreateArticle() throws Exception {
        //Changement de l'idSection dans le JSON de création d'article
        ArticleDAO articleDAO = objectMapper.readValue(articleCreateJson, ArticleDAO.class);
        articleDAO.setIdSection(idSection);
        // CREATE
        mockPerform.performRequest(HttpMethod.POST, "/articles", token,
                articleDAO,
                status().isCreated());
        // VERIFY CREATION
        List<ArticleEntity> articles = articleRepository.findAll();
        assertThat(articles).hasSize(1);
        ArticleEntity article = articles.getFirst();
        assertThat(article.getTitle()).isEqualTo("Mon premier article");
        assertThat(article.getContent()).isEqualTo("Contenu de l'article en texte long...");
    }

    private void checkWrongUpdateArticle(String idArticle) throws Exception {

        ArticleDAO articleUpdate = objectMapper.readValue(articleUpdateJson, ArticleDAO.class);
        articleUpdate.setIdArticle(UUID.fromString(idArticle));
        articleUpdate.setIdSection(999L);
        mockPerform.performRequest(HttpMethod.PUT, "/articles/" + idArticle, token,
                articleUpdate,
                status().isNotFound());

        articleUpdate.setIdArticle(UUID.fromString("46cbb04f-19ca-48ff-8366-2d0a2271a060"));
        articleUpdate.setIdSection(idSection);
        mockPerform.performRequest(HttpMethod.PUT, "/articles/" + idArticle, token,
                articleUpdate,
                status().isNotFound());

    }

}