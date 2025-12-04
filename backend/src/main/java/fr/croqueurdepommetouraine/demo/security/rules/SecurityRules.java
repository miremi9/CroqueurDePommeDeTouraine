package fr.croqueurdepommetouraine.demo.security.rules;

import fr.croqueurdepommetouraine.demo.security.ROLES;
import org.springframework.http.HttpMethod;

import java.util.List;

public class SecurityRules {

    public static List<SecurityRule> rules() {
        List<SecurityRule> securityRules = List.of(
                SecurityRule.permitAll(HttpMethod.POST, "auth/login"),
                SecurityRule.permitAll(HttpMethod.POST, "auth/register"),

                SecurityRule.restricted(HttpMethod.GET, "/admin/**", ROLES.ROLE_ADMIN),

                SecurityRule.permitAll(HttpMethod.GET, "/articles"),
                SecurityRule.permitAll(HttpMethod.GET, "/articles/**"),
                SecurityRule.restricted(HttpMethod.PUT, "/articles", ROLES.ROLE_ADMIN, ROLES.ROLE_EDITOR),
                SecurityRule.restricted(HttpMethod.POST, "/articles", ROLES.ROLE_ADMIN, ROLES.ROLE_MODERATOR, ROLES.ROLE_EDITOR),
                SecurityRule.restricted(HttpMethod.DELETE, "/articles*", ROLES.ROLE_ADMIN, ROLES.ROLE_MODERATOR, ROLES.ROLE_EDITOR),

                SecurityRule.permitAll(HttpMethod.GET, "/illustrations"),
                SecurityRule.permitAll(HttpMethod.GET, "/illustrations/**"),
                SecurityRule.restricted(HttpMethod.POST, "/illustrations", ROLES.ROLE_ADMIN, ROLES.ROLE_MODERATOR, ROLES.ROLE_EDITOR),

                SecurityRule.restricted(HttpMethod.GET, "/users", ROLES.ROLE_ADMIN),
                SecurityRule.restricted(HttpMethod.PUT, "/users/**", ROLES.ROLE_ADMIN),

                SecurityRule.permitAll(HttpMethod.GET, "/sections"),
                SecurityRule.restricted(HttpMethod.POST, "/sections", ROLES.ROLE_ADMIN),
                SecurityRule.permitAll(null, "/error"),

                SecurityRule.permitAll(HttpMethod.GET, "/site-body"),
                SecurityRule.restricted(HttpMethod.PUT, "/site-body", ROLES.ROLE_ADMIN),

                SecurityRule.restricted(HttpMethod.GET, "/roles", ROLES.ROLE_ADMIN),
                SecurityRule.restricted(HttpMethod.PUT, "/roles", ROLES.ROLE_ADMIN),
                SecurityRule.restricted(HttpMethod.POST, "/roles", ROLES.ROLE_ADMIN),
                SecurityRule.restricted(HttpMethod.DELETE, "/roles/**", ROLES.ROLE_ADMIN),

                // Par défaut, tout le reste est authentifié
                SecurityRule.restricted(null, "/**") // null = toutes méthodes
        );
        return securityRules;
    }
}
