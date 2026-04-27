package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
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
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest//(properties = "logging.level.org.springframework=DEBUG")
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class creationArticleTI {
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
    private MockMvc mockMvc;
    private static String createUserJson;
    private static String loginJson;
    private static String articleCreateJson;
    private static String articleUpdateJson;


    private String token;
    private Long idSection;

    @BeforeAll
    static void setup() throws IOException {
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile-admin.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login-admin.json"));
        articleCreateJson = Files.readString(
                Path.of("src/test/resources/requet/article/create-article.json"));
        articleUpdateJson = Files.readString(
                Path.of("src/test/resources/requet/article/update-article.json"));


    }

    @BeforeEach
    void createAdmin() throws Exception {
        userRepository.deleteAll();
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserJson))
                .andExpect(status().isOk());

        // extraire le token (simplifié)
        token = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(token);
        token = jsonNode.get("token").asText();
        SectionSiteEntity section = new SectionSiteEntity();

        section.setNom("Section Test");
        section.setPath("section-test");
        section = sectionRepository.save(section);
        idSection = section.getIdSection();
    }

    @Test
    void testCreateArticles() throws Exception {

        checkCreateArticle();
        String idArticle = checkGetArticles();
        checkUpdateArticle(idArticle);
        checkWrongUpdateArticle(idArticle);
    }

    private void checkUpdateArticle(String idArticle) throws Exception {

        ObjectNode node = (ObjectNode) objectMapper.readTree(articleUpdateJson);
        node.put("idArticle", idArticle);
        articleUpdateJson = objectMapper.writeValueAsString(node);


        mockMvc.perform(put("/articles/" + idArticle)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleUpdateJson))
                .andExpect(status().isOk());

        // VERIFY UPDATE
        ArticleEntity updated = articleRepository.findById(UUID.fromString(idArticle)).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Titre2");
        assertThat(updated.getContent()).isEqualTo("Contenu2");
    }

    private String checkGetArticles() throws Exception {
        String response = mockMvc.perform(get("/articles")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();


        JsonNode articleNode = objectMapper.readTree(response).get(0);

        assertThat(articleNode.get("idSection").asLong()).isEqualTo(idSection);
        return articleNode.get("idArticle").asText();
    }

    private void checkCreateArticle() throws Exception {
        //Changement de l'idSection dans le JSON de création d'article
        ObjectNode node = (ObjectNode) objectMapper.readTree(articleCreateJson);
        node.put("idSection", idSection);
        articleCreateJson = objectMapper.writeValueAsString(node);

        // CREATE
        mockMvc.perform(post("/articles")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleCreateJson))
                .andExpect(status().isCreated());
        // VERIFY CREATION
        List<ArticleEntity> articles = articleRepository.findAll();
        assertThat(articles).hasSize(1);
        ArticleEntity article = articles.getFirst();
        assertThat(article.getTitle()).isEqualTo("Mon premier article");
        assertThat(article.getContent()).isEqualTo("Contenu de l'article en texte long...");
    }

    private void checkWrongUpdateArticle(String idArticle) throws Exception {

        ObjectNode node = (ObjectNode) objectMapper.readTree(articleUpdateJson);
        node.put("idArticle", idArticle);
        node.put("idSection", 9999L);
        articleUpdateJson = objectMapper.writeValueAsString(node);
        mockMvc.perform(put("/articles/" + idArticle)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleUpdateJson))
                .andExpect(status().isNotFound());

        node = (ObjectNode) objectMapper.readTree(articleUpdateJson);
        node.put("idArticle", "46cbb04f-19ca-48ff-8366-2d0a2271a060");
        node.put("idSection", 9999L);
        articleUpdateJson = objectMapper.writeValueAsString(node);
        mockMvc.perform(put("/articles/" + "46cbb04f-19ca-48ff-8366-2d0a2271a060")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleUpdateJson))
                .andExpect(status().isNotFound());
    }


}