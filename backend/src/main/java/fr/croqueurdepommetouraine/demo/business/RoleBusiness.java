package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.DAO.RoleDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.erreurs.NotFoundException;
import fr.croqueurdepommetouraine.demo.erreurs.RequeteIncorrect;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import fr.croqueurdepommetouraine.demo.transformer.RoleMapper;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@AllArgsConstructor
public class RoleBusiness {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    public RoleDAO getRoleByName(String roleName) {
        return roleRepository.findByNomRole(roleName).map(roleMapper::toDAO)
                .orElseThrow(() -> new NotFoundException("Role with name " + roleName + " not found."));
    }

    public Set<RoleDAO> getAllRoles() {
        return roleRepository.findAll().stream()
                .filter(roleEntity -> roleEntity.getDeleted() != Boolean.TRUE)
                .map(roleMapper::toDAO)

                .collect(Collectors.toSet());
    }

    public RoleDAO createRole(RoleDAO roleDAO) {
        if (roleDAO.getNomRole() == null || roleDAO.getNomRole().isEmpty()) {
            throw new RequeteIncorrect("Role name cannot be null or empty.");
        }
        if (roleRepository.findByNomRole(roleDAO.getNomRole()).isPresent()) {
            throw new RequeteIncorrect("Role with name " + roleDAO.getNomRole() + " already exists.");
        }

        return roleMapper.toDAO(roleRepository.save(roleMapper.toEntity(roleDAO)));
    }

    public RoleDAO updateRole(RoleDAO roleDAO) {
        if (roleDAO.getIdRole() == null) {
            throw new RequeteIncorrect("Role ID cannot be null for update.");
        }
        if (!roleRepository.existsById(roleDAO.getIdRole())) {
            throw new RequeteIncorrect("Role with ID " + roleDAO.getIdRole() + " does not exist.");
        }
        if (roleDAO.getNomRole() == null || roleDAO.getNomRole().isEmpty()) {
            throw new RequeteIncorrect("Role name cannot be null or empty.");
        }
        if (ROLES.ALL_ROLES.contains(roleDAO.getNomRole())) {
            throw new RequeteIncorrect("Cannot update to a reserved role name: " + roleDAO.getNomRole());
        }
        return roleMapper.toDAO(roleRepository.save(roleMapper.toEntity(roleDAO)));
    }

    public void deleteRole(Long roleId) {
        RoleEntity existingRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role with ID " + roleId + " does not exist."));

        RoleDAO roleDAO = roleMapper.toDAO(roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role with ID " + roleId + " does not exist.")));

        if (ROLES.ALL_ROLES.contains(roleDAO.getNomRole())) {
            throw new NotFoundException("Cannot delete reserved role: " + roleDAO.getNomRole());
        }
        existingRole.setDeleted(Boolean.TRUE);
        roleRepository.save(existingRole);
    }
}
