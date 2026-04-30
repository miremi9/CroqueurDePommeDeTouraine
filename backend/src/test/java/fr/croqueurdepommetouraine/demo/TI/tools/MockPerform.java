package fr.croqueurdepommetouraine.demo.TI.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@Component
@AllArgsConstructor
public class MockPerform {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    public String performRequest(HttpMethod method,
                                 String url,
                                 String token,
                                 Object body,
                                 ResultMatcher statusMatcher,
                                 Object expectedResponse) throws Exception {

        MockHttpServletRequestBuilder request =
                MockMvcRequestBuilders.request(method, url)
                        .contentType(MediaType.APPLICATION_JSON);

        if (body != null && method != HttpMethod.GET) {
            request.content(objectMapper.writeValueAsString(body));
        }

        if (token != null && !token.isBlank()) {
            request.header("Authorization", "Bearer " + token);
        }

        ResultActions result = mockMvc.perform(request)
                .andExpect(statusMatcher);

        if (expectedResponse != null) {
            String expectedJson = objectMapper.writeValueAsString(expectedResponse);
            result.andExpect(content().json(expectedJson, false));
        }

        return result.andReturn()
                .getResponse()
                .getContentAsString();
    }

    public String performRequest(HttpMethod method,
                                 String url,
                                 String token, Object body,
                                 ResultMatcher statusMatcher) throws Exception {
        return performRequest(method, url, token, body, statusMatcher, null);
    }
}