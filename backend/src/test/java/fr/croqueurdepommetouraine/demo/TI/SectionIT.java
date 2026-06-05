package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.TI.tools.ClassicMethods;
import fr.croqueurdepommetouraine.demo.TI.tools.MockPerform;
import fr.croqueurdepommetouraine.demo.repository.ArticleRepository;
import fr.croqueurdepommetouraine.demo.repository.IllustrationRepository;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
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
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SectionIT {
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
    private MockPerform mockPerform;
    @Autowired
    private ClassicMethods classicMethods;

    private static String sectionCreateJson;
    private static String sectionUpdateJson;
    private static String sectionCreateChildJson;
    private static String createUserJson;
    private static String loginJson;

    private String token;
    private String userToken;

    @BeforeAll
    void setup() throws IOException {
        articleRepository.deleteAll();
        illustrationRepository.deleteAll();
        sectionRepository.deleteAll();
        userRepository.deleteAll();

        sectionCreateJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section.json"));
        sectionUpdateJson = Files.readString(
                Path.of("src/test/resources/requet/section/update-section.json"));
        sectionCreateChildJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section-child.json"));
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login.json"));

    }

    @BeforeEach
    void createUsers() throws Exception {
        articleRepository.deleteAll();
        illustrationRepository.deleteAll();
        sectionRepository.deleteAll();
        userRepository.deleteAll();

        token = classicMethods.createAdminToken();
        createStandardUserAndLogin();
    }

    @Test
    void testSectionFullFlowWithRoleComplexity() throws Exception {
        createCustomRole();
        updateUserWithCustomRole();
        verifyCustomRoleUserCannotCreateSection();

        Long id = createMainSectionAsAdmin();
        verifyGetAllSectionsContainsCreatedSection();
        updateSectionAsAdmin(id);
        createChildSectionAsAdmin(id);
        verifyDuplicateChildSectionIsRejected(id);
    }

    private Long createMainSectionAsAdmin() throws Exception {
        String createResponse = mockPerform.performRequest(HttpMethod.POST, "/sections", token,
                objectMapper.readValue(sectionCreateJson, Object.class),
                status().isCreated());
        List<SectionSiteEntity> sections = sectionRepository.findAll();
        assertThat(sections).hasSize(1);
        assertThat(sections.getFirst().getNom()).isEqualTo("Section Test");
        return objectMapper.readTree(createResponse).get("idSection").asLong();
    }

    private void verifyGetAllSectionsContainsCreatedSection() throws Exception {
        String response = mockPerform.performRequest(HttpMethod.GET, "/sections", null, null, status().isOk());
        assertThat(response).contains("Section Test");
    }

    private void updateSectionAsAdmin(Long id) throws Exception {
        mockPerform.performRequest(HttpMethod.PUT, "/sections/" + id, token,
                objectMapper.readValue(sectionUpdateJson, Object.class),
                status().isOk());
        SectionSiteEntity updated = sectionRepository.findById(id).orElseThrow();
        assertThat(updated.getNom()).isEqualTo("Section Updated");
        assertThat(updated.getPath()).isEqualTo("updated-path");
    }

    private void createChildSectionAsAdmin(Long parentId) throws Exception {
        JsonNode sectionChild = objectMapper.readTree(sectionCreateChildJson);
        ObjectNode sectionChildObjectNode = (ObjectNode) sectionChild;
        sectionChildObjectNode.put("idParent", parentId);
        mockPerform.performRequest(HttpMethod.POST, "/sections", token,
                objectMapper.readValue(objectMapper.writeValueAsString(sectionChildObjectNode), Object.class),
                status().isCreated());

        List<SectionSiteEntity> sections = sectionRepository.findAll();
        assertThat(sections).hasSize(2);
        assertThat(sections.getLast().getNom()).isEqualTo("Section Test CHILD");
        assertThat(sections.getLast().getParent()).isNotNull();
    }

    private void verifyDuplicateChildSectionIsRejected(Long parentId) throws Exception {
        JsonNode sectionChild = objectMapper.readTree(sectionCreateChildJson);
        ObjectNode sectionChildObjectNode = (ObjectNode) sectionChild;
        sectionChildObjectNode.put("idParent", parentId);
        mockPerform.performRequest(HttpMethod.POST, "/sections", token,
                objectMapper.readValue(objectMapper.writeValueAsString(sectionChildObjectNode), Object.class),
                status().is4xxClientError());

        List<SectionSiteEntity> sections = sectionRepository.findAll();
        assertThat(sections).hasSize(2);
    }

    private void createCustomRole() throws Exception {
        String customRoleJson = """
                {
                  "nomRole": "ROLE_EDITOR_TEST"
                }
                """;
        mockPerform.performRequest(HttpMethod.POST, "/roles", token,
                objectMapper.readValue(customRoleJson, Object.class),
                status().isCreated());
    }

    private void updateUserWithCustomRole() throws Exception {
        UUID userId = findUserIdByName("Test");
        UserDAO updatedUser = new UserDAO();
        updatedUser.setNom("Test");
        updatedUser.setEmail("test@mail.com");
        updatedUser.setRoles(List.of("ROLE_EDITOR_TEST"));

        mockPerform.performRequest(HttpMethod.PUT, "/users/" + userId, token,
                updatedUser,
                status().isOk());
    }

    private void verifyCustomRoleUserCannotCreateSection() throws Exception {
        mockPerform.performRequest(HttpMethod.POST, "/sections", userToken,
                objectMapper.readValue(sectionCreateJson, Object.class),
                status().isForbidden());
        assertThat(sectionRepository.findAll()).isEmpty();
    }

    private UUID findUserIdByName(String username) throws Exception {
        String usersResponse = mockPerform.performRequest(HttpMethod.GET, "/users", token,
                null,
                status().isOk());
        JsonNode usersNode = objectMapper.readTree(usersResponse);
        for (JsonNode user : usersNode) {
            if (username.equals(user.get("nom").asText())) {
                return UUID.fromString(user.get("idUser").asText());
            }
        }
        throw new IllegalStateException("User " + username + " not found");
    }

    private void createStandardUserAndLogin() throws Exception {
        mockPerform.performRequest(HttpMethod.POST, "/auth/register", null,
                objectMapper.readValue(createUserJson, Object.class),
                status().isOk());
        String loginResponse = mockPerform.performRequest(HttpMethod.POST, "/auth/login", null,
                objectMapper.readValue(loginJson, Object.class),
                status().isOk());
        userToken = objectMapper.readTree(loginResponse).get("token").asText();
    }
}