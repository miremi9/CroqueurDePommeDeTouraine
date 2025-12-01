package fr.croqueurdepommetouraine.demo.security;

import java.util.Set;

public record ROLES() {
    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MODERATOR = "MODERATEUR";
    public static final String ROLE_EDITOR = "EDITEUR";
    public static final String ROLE_MEMBRE = "MEMBRE";


    public static final Set<String> ALL_ROLES = Set.of(
            ROLE_USER,
            ROLE_ADMIN,
            ROLE_MODERATOR,
            ROLE_EDITOR,
            ROLE_MEMBRE
    );
}
