package fr.croqueurdepommetouraine.demo.tools;

import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import fr.croqueurdepommetouraine.demo.security.JwtUtils;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@AllArgsConstructor
public class ToolsAuthorisationEndPoint {

    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final JwtUtils jwtUtils;


    public boolean CanReadThisSection(String authHeader, Long idSection) {
        List<String> rolesNeeded = getRoleOfSection(idSection);
        Set<String> rolesUser = getRoles(getUser(getUserNameFromHeader(authHeader)));
        return (rolesUser.stream().anyMatch(rolesNeeded::contains));
    }

    public boolean CanReadSection(SectionSiteEntity section, UserEntity user) {
        if (user == null) {
            return section.getRoles().stream().map(s -> s.getNomRole()).toList().contains("USER");
        }

        Set<RoleEntity> rolesNeeded = section.getRoles();
        Set<RoleEntity> rolesUser = user.getRoles();
        return (rolesUser.stream().anyMatch(rolesNeeded::contains));
    }

    public UserEntity getUserFromHeader(String header) {
        return getUser(getUserNameFromHeader(header));
    }


    private List<String> getRoleOfSection(Long idSection) {
        return sectionRepository.getReferenceById(idSection)
                .getRoles()
                .stream().map(RoleEntity::getNomRole)
                .toList();
    }

    private String getUserNameFromHeader(String AuthHeader) {
        String username = "";
        if (AuthHeader != null && AuthHeader.startsWith("Bearer ")) {
            String token = AuthHeader.substring(7);
            username = jwtUtils.extractUsername(token); // méthode de décodage du JWT
        }
        return username;
    }

    private UserEntity getUser(String userName) {
        return userRepository.findByNom(userName);
    }

    private Set<String> getRoles(UserEntity userEntity) {
        Set<String> roles = new HashSet<>();
        roles.add(ROLES.ROLE_USER);
        if (userEntity != null && userEntity.getRoles() != null) {
            roles.addAll(userEntity.getRoles()
                    .stream()
                    .map(RoleEntity::getNomRole)
                    .collect(Collectors.toSet()));
        }
        return roles;
    }
}
