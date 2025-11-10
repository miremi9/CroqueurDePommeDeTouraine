package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.HashSet;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "idUser", target = "idUser")
    @Mapping(ignore = true, target = "roles")
    UserDAO toDAO(UserEntity userEntity);

    @AfterMapping
    default void mapRoles(UserEntity userEntity, @MappingTarget UserDAO userDAO) {
        if (userEntity.getRoles() != null) {
            userDAO.setRoles(userEntity.getRoles().stream()
                    .map(RoleEntity::getNomRole)
                    .toList());
        }
    }

    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "idUser", target = "idUser")
    @Mapping(ignore = true, target = "roles")
    UserEntity toEntity(UserDAO userDAO);

    @AfterMapping
    default void mapRolesBack(UserDAO userDAO, @MappingTarget UserEntity userEntity) {
        if (userDAO.getRoles() != null) {
            userEntity.setRoles(new HashSet<>());
            for (String roleName : userDAO.getRoles()) {
                System.out.println("Mapping role: " + roleName);

                if (ROLES.ALL_ROLES.contains(roleName)) {
                    RoleEntity roleEntity = new RoleEntity();
                    roleEntity.setNomRole(roleName);
                    userEntity.getRoles().add(roleEntity);
                } else {
                    throw new IllegalArgumentException("Invalid role name: " + roleName);
                }
            }

        }
    }

}
