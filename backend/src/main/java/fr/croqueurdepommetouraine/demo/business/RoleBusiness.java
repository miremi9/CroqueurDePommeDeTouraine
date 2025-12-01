package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@AllArgsConstructor
public class RoleBusiness {
    private final RoleRepository roleRepository;

    public RoleEntity getRoleByName(String roleName) {
        return roleRepository.findByNomRole(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role with name " + roleName + " not found."));
    }
}
