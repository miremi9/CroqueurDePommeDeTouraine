package fr.croqueurdepommetouraine.demo.TI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
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

@SpringBootTest//(properties = "logging.level.org.springframework=DEBUG")
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class SectionIT {
    @MockitoBean
    private JavaMailSender javaMailSender;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;
    private static String createUserJson;
    private static String loginJson;
    private static String sectionCreateJson;
    private static String sectionUpdateJson;
    private static String sectionCreateChildJson;


    private String token;

    @BeforeAll
    static void setup() throws IOException {

        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile-admin.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login-admin.json"));
        sectionCreateJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section.json"));
        sectionUpdateJson = Files.readString(
                Path.of("src/test/resources/requet/section/update-section.json"));
        sectionCreateChildJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section-child.json"));


    }

    @BeforeEach
    void createAdmin() throws Exception {
        userRepository.deleteAll();
        sectionRepository.deleteAll();
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
    }

    @Test
    void testCreateSection() throws Exception {

        //CREATE
        mockMvc.perform(post("/sections")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sectionCreateJson))
                .andExpect(status().isCreated());
        List<SectionSiteEntity> sections = sectionRepository.findAll();
        assertThat(sections).hasSize(1);
        assertThat(sections.getFirst().getNom()).isEqualTo("Section Test");

        Long id = sections.getFirst().getIdSection();
        // VERIFY GET
        mockMvc.perform(get("/sections")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String response = result.getResponse().getContentAsString();
                    assertThat(response).contains("Section Test");
                });

        // UPDATE
        String ParentSection = mockMvc.perform(put("/sections/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sectionUpdateJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // VERIFY UPDATE
        SectionSiteEntity updated = sectionRepository.findById(id).orElseThrow();
        assertThat(updated.getNom()).isEqualTo("Section Updated");
        assertThat(updated.getPath()).isEqualTo("updated-path");

        //SET DYNAMIC PARENT ID IN CHILD JSON
        JsonNode sectionChild = objectMapper.readTree(sectionCreateChildJson);
        ObjectNode sectionChildObjectNode = (ObjectNode) sectionChild;
        sectionChildObjectNode.put("idParent", id);
        sectionCreateChildJson = objectMapper.writeValueAsString(sectionChildObjectNode);
        // CREATE CHILD
        mockMvc.perform(post("/sections")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sectionCreateChildJson))
                .andExpect(status().isCreated());

        sections = sectionRepository.findAll();
        assertThat(sections).hasSize(2);
        assertThat(sections.getLast().getNom()).isEqualTo("Section Test CHILD");
        assertThat(sections.getLast().getParent()).isNotNull();

        //CREATE DOUBLON
        mockMvc.perform(post("/sections")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sectionCreateChildJson))
                .andExpect(status().is4xxClientError());
        sections = sectionRepository.findAll();
        assertThat(sections).hasSize(2);

    }


}