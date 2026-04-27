package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ArticleIT {
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
    private static String sectionCreateJson;
    private static String articleCreateJson;

    private String token;
    private Long sectionId;

    @BeforeAll
    static void setup() throws IOException {
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile-admin.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login-admin.json"));
        sectionCreateJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section.json"));
        articleCreateJson = Files.readString(
                Path.of("src/test/resources/requet/article/create-article.json"));
    }

    @BeforeEach
    void createAdminAndSection() throws Exception {
        userRepository.deleteAll();
        sectionRepository.deleteAll();
        articleRepository.deleteAll();
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserJson))
                .andExpect(status().isOk());
        // extraire le token
        token = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(token);
        token = jsonNode.get("token").asText();
        // Créer une section
        mockMvc.perform(post("/sections")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sectionCreateJson))
                .andExpect(status().isCreated());
        sectionId = sectionRepository.findAll().get(0).getIdSection();
    }

    @Test
    void testCreateArticle() throws Exception {
        // Charger le JSON et injecter dynamiquement l'idSection
        JsonNode articleNode = objectMapper.readTree(articleCreateJson);
        ((com.fasterxml.jackson.databind.node.ObjectNode) articleNode).put("idSection", sectionId);
        ((com.fasterxml.jackson.databind.node.ObjectNode) articleNode).put("title", "Titre Article Test");
        ((com.fasterxml.jackson.databind.node.ObjectNode) articleNode).put("content", "Contenu de test d'article");
        String articleJson = objectMapper.writeValueAsString(articleNode);
        mockMvc.perform(post("/articles")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson))
                .andExpect(status().isCreated());
        List<ArticleEntity> articles = articleRepository.findAll();
        assertThat(articles).hasSize(1);
        assertThat(articles.get(0).getTitle()).isEqualTo("Titre Article Test");
        assertThat(articles.get(0).getSection().getIdSection()).isEqualTo(sectionId);
    }
}

