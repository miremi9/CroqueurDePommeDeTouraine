package fr.croqueurdepommetouraine.demo.TI.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Component
@AllArgsConstructor
public class ClassicMethods {
    private MockPerform mockPerform;
    private ObjectMapper objectMapper;

    private static String createUserJson;
    private static String loginJson;

    public String createAdminToken() throws Exception {
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile-admin.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login-admin.json"));

        mockPerform.performRequest(HttpMethod.POST, "/auth/register", null,
                objectMapper.readValue(createUserJson, Object.class),
                status().isOk());

        // login
        String response = mockPerform.performRequest(HttpMethod.POST, "/auth/login", null,
                objectMapper.readValue(loginJson, Object.class),
                status().isOk());
        return objectMapper.readTree(response).get("token").asText();
    }

    public String createUserToken() throws Exception {
        createUserJson = Files.readString(
                Path.of("src/test/resources/requet/user/create-profile.json"));
        loginJson = Files.readString(
                Path.of("src/test/resources/requet/user/login.json"));

        mockPerform.performRequest(HttpMethod.POST, "/auth/register", null,
                objectMapper.readValue(createUserJson, Object.class),
                status().isOk());

        // login
        String response = mockPerform.performRequest(HttpMethod.POST, "/auth/login", null,
                objectMapper.readValue(loginJson, Object.class),
                status().isOk());
        return objectMapper.readTree(response).get("token").asText();
    }

    public Long createSection(String token) throws Exception {
        String sectionCreateJson = Files.readString(
                Path.of("src/test/resources/requet/section/create-section.json"));
        String response = mockPerform.performRequest(HttpMethod.POST, "/sections", token,
                objectMapper.readValue(sectionCreateJson, Object.class),
                status().isCreated());
        return objectMapper.readTree(response).get("idSection").asLong();
    }

}
