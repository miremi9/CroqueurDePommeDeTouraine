package fr.croqueurdepommetouraine.demo.security.rules;


import org.springframework.http.HttpMethod;

public record SecurityRule(HttpMethod method, String pattern, String[] roles, boolean permitAll) {

    public static SecurityRule permitAll(HttpMethod method, String pattern) {
        return new SecurityRule(method, pattern, new String[]{}, true);
    }

    public static SecurityRule restricted(HttpMethod method, String pattern, String... roles) {
        return new SecurityRule(method, pattern, roles, false);
    }
}
