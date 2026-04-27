package fr.croqueurdepommetouraine.demo.TI;

import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeAll;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "logging.level.org.springframework=DEBUG")
@EntityScan(basePackages = "fr.croqueurdepommetouraine.demo.Entity")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class UserIntegrationTest {
    @MockitoBean
    private JavaMailSender javaMailSender;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MockMvc mockMvc;
    private static String createUserJson;
    private static String loginJson;
    private static String badCreateUserJson;

    @BeforeAll
    static void setup() throws IOException {
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login.json"));
        badCreateUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile-bad.json"));

    }

    @Test
    void testCreateUserOK() throws Exception {
        //read json


        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserJson))
                .andExpect(status().isOk());

        // Vérification de la persistance en base de données
        List<UserEntity> users = userRepository.findAll();
        assertThat(users).hasSize(1);
        assertThat(users.getFirst().getEmail()).isEqualTo("test@mail.com");

        //verifie que le login return ok + token
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String response = result.getResponse().getContentAsString();
                    assertThat(response).contains("token");
                });
    }

    @Test
    void testCreateUserBadRequest() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badCreateUserJson))
                .andExpect(status().isBadRequest());
        List<UserEntity> users = userRepository.findAll();
        assertThat(users).hasSize(0);
    }

}