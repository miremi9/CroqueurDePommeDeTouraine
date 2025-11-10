package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.SectionDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.ArrayList;
import java.util.HashSet;

@Mapper(componentModel = "spring")
public interface SectionMapper {
    @Mapping(source = "idSection", target = "idSection")
    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "path", target = "path")
    @Mapping(source = "supprimed", target = "supprimed")
    @Mapping(ignore = true, target = "roles")
    SectionDAO toDAO(SectionSiteEntity entity);

    @AfterMapping
    default void handleParentEntity(SectionSiteEntity entity, @MappingTarget SectionDAO dao) {
        if (entity.getParent() != null) {
            dao.setIdParent(entity.getParent().getIdSection());
        }
        dao.setRoles(new ArrayList<>());
        if (entity.getRoles() != null) {
            dao.setRoles(entity.getRoles().stream()
                    .map(RoleEntity::getNomRole)
                    .toList());
        }
    }

    @Mapping(source = "idSection", target = "idSection")
    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "path", target = "path")
    @Mapping(source = "supprimed", target = "supprimed")
    @Mapping(ignore = true, target = "roles")
    SectionSiteEntity toEntity(SectionDAO dao);

    @AfterMapping
    default void toEntityMappingParentAndRoles(SectionDAO dao, @MappingTarget SectionSiteEntity entity) {
        if (dao.getIdParent() != null) {
            SectionSiteEntity parentEntity = new SectionSiteEntity();
            parentEntity.setIdSection(dao.getIdParent());
            entity.setParent(parentEntity);
        }
        entity.setRoles(new HashSet<>());
        if (dao.getRoles() != null) {
            for (String roleName : dao.getRoles()) {
                RoleEntity roleEntity = new RoleEntity();
                roleEntity.setNomRole(roleName);
                entity.getRoles().add(roleEntity);
            }
        }
    }

}
