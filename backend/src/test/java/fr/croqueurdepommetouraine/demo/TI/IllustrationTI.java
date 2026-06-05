package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import fr.croqueurdepommetouraine.demo.TI.tools.ClassicMethods;
import fr.croqueurdepommetouraine.demo.TI.tools.MockPerform;
import fr.croqueurdepommetouraine.demo.repository.ArticleRepository;
import fr.croqueurdepommetouraine.demo.repository.IllustrationRepository;
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
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class IllustrationTI {
    @MockitoBean
    private JavaMailSender javaMailSender;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private IllustrationRepository illustrationRepository;
    @Autowired
    private ArticleRepository articleRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private MockPerform mockPerform;
    @Autowired
    private ClassicMethods classicMethods;

    private static String articleCreateJson;

    private String token;
    private Long idSection;

    @BeforeAll
    static void setup() throws IOException {
        articleCreateJson = Files.readString(
                Path.of("src/test/resources/requet/article/create-article.json"));
    }

    @BeforeEach
    void createAdminSection() throws Exception {
        articleRepository.deleteAll();
        illustrationRepository.deleteAll();
        sectionRepository.deleteAll();
        userRepository.deleteAll();

        token = classicMethods.createAdminToken();
        idSection = classicMethods.createSection(token);
    }

    @Test
    void testFullProcessUploadIllustrationThenCreateArticle() throws Exception {
        UUID idIllustration = uploadIllustration();
        verifyIllustrationEndpoints(idIllustration);
        createArticleWithIllustration(idIllustration);
    }

    @Test
    void testUploadIllustrationWithoutAuthorization() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        mockMvc.perform(multipart("/illustrations")
                        .file(file))
                .andExpect(status().is4xxClientError());

        assertThat(illustrationRepository.findAll()).isEmpty();
    }

    @Test
    void testUploadIllustrationWithIncompleteCallMissingFile() throws Exception {
        mockMvc.perform(multipart("/illustrations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        assertThat(illustrationRepository.findAll()).isEmpty();
    }

    @Test
    void testCreateArticleWithInconsistentIllustrationId() throws Exception {
        ArticleDAO articleDAO = objectMapper.readValue(articleCreateJson, ArticleDAO.class);
        articleDAO.setIdSection(idSection);
        articleDAO.setIdIllustrationDAOS(List.of(UUID.randomUUID()));

        mockPerform.performRequest(HttpMethod.POST, "/articles", token,
                articleDAO,
                status().isNotFound());

        assertThat(articleRepository.findAll()).isEmpty();
    }

    private UUID uploadIllustration() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        String response = mockMvc.perform(multipart("/illustrations")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        UUID idIllustration = UUID.fromString(objectMapper.readTree(response).get("idIllustration").asText());
        List<IllustrationEntity> illustrations = illustrationRepository.findAll();
        assertThat(illustrations).hasSize(1);
        assertThat(illustrations.getFirst().getIdIllustration()).isEqualTo(idIllustration);
        assertThat(illustrations.getFirst().getPath()).endsWith("_cover.jpg");

        return idIllustration;
    }

    private void verifyIllustrationEndpoints(UUID idIllustration) throws Exception {
        mockPerform.performRequest(HttpMethod.GET, "/illustrations/" + idIllustration, token,
                null,
                status().isOk());

        mockPerform.performRequest(HttpMethod.GET, "/illustrations/" + idIllustration + "/file", token,
                null,
                status().isOk());
    }

    private void createArticleWithIllustration(UUID idIllustration) throws Exception {
        ArticleDAO articleDAO = objectMapper.readValue(articleCreateJson, ArticleDAO.class);
        articleDAO.setIdSection(idSection);
        articleDAO.setIdIllustrationDAOS(List.of(idIllustration));

        mockPerform.performRequest(HttpMethod.POST, "/articles", token,
                articleDAO,
                status().isCreated());

        List<ArticleEntity> articles = articleRepository.findAll();
        assertThat(articles).hasSize(1);
        ArticleEntity articleEntity = articles.getFirst();
        assertThat(articleEntity.getSection().getIdSection()).isEqualTo(idSection);
        assertThat(articleEntity.getPathsImages()).hasSize(1);
        assertThat(articleEntity.getPathsImages().getFirst().getIdIllustration()).isEqualTo(idIllustration);
    }
}
