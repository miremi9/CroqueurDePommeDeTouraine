package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashSet;

@Mapper(componentModel = "spring")
public abstract class UserMapper {

    @Autowired
    protected RoleRepository roleRepository;

    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "idUser", target = "idUser")
    @Mapping(ignore = true, target = "roles")
    public abstract UserDAO toDAO(UserEntity userEntity);

    @AfterMapping
    public void mapRoles(UserEntity userEntity, @MappingTarget UserDAO userDAO) {
        if (userEntity.getRoles() != null) {
            userDAO.setRoles(userEntity.getRoles().stream()
                    .map(RoleEntity::getNomRole)
                    .toList());
        }
    }

    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "idUser", target = "idUser")
    @Mapping(ignore = true, target = "roles")
    public abstract UserEntity toEntity(UserDAO userDAO);

    @AfterMapping
    public void mapRolesBack(UserDAO userDAO, @MappingTarget UserEntity userEntity) {
        if (userDAO.getRoles() != null) {
            userEntity.setRoles(new HashSet<>());
            for (String roleName : userDAO.getRoles()) {
                RoleEntity roleEntity = roleRepository.findByNomRole(roleName)
                        .orElseGet(() -> {
                            RoleEntity r = new RoleEntity();
                            r.setNomRole(roleName);
                            return roleRepository.save(r);
                        });
                userEntity.getRoles().add(roleEntity);

            }

        }
    }

}
