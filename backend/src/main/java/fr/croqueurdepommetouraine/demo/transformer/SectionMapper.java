package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.SectionDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashSet;

@Mapper(componentModel = "spring")
public abstract class SectionMapper {

    @Autowired
    protected RoleRepository roleRepository;

    @Mapping(source = "idSection", target = "idSection")
    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "path", target = "path")
    @Mapping(source = "supprimed", target = "supprimed")
    @Mapping(ignore = true, target = "rolesCanRead")
    @Mapping(ignore = true, target = "rolesCanWrite")
    public abstract SectionDAO toDAO(SectionSiteEntity entity);

    @AfterMapping
    public void handleParentEntity(SectionSiteEntity entity, @MappingTarget SectionDAO dao) {
        if (entity.getParent() != null) {
            dao.setIdParent(entity.getParent().getIdSection());
        }
        dao.setRolesCanRead(new ArrayList<>());
        if (entity.getRolesCanRead() != null) {
            dao.setRolesCanRead(entity.getRolesCanRead().stream()
                    .map(RoleEntity::getNomRole)
                    .toList());
        }

        dao.setRolesCanWrite(new ArrayList<>());
        if (entity.getRolesCanWrite() != null) {
            dao.setRolesCanWrite(entity.getRolesCanWrite().stream()
                    .map(RoleEntity::getNomRole)
                    .toList());
        }
    }

    @Mapping(source = "idSection", target = "idSection")
    @Mapping(source = "nom", target = "nom")
    @Mapping(source = "path", target = "path")
    @Mapping(source = "supprimed", target = "supprimed")
    @Mapping(ignore = true, target = "parent")
    @Mapping(ignore = true, target = "rolesCanRead")
    @Mapping(ignore = true, target = "rolesCanWrite")
    public abstract SectionSiteEntity toEntity(SectionDAO dao);

    @AfterMapping
    public void toEntityMappingParentAndRoles(SectionDAO dao, @MappingTarget SectionSiteEntity entity) {
        if (dao.getIdParent() != null) {
            SectionSiteEntity parentEntity = new SectionSiteEntity();
            parentEntity.setIdSection(dao.getIdParent());
            entity.setParent(parentEntity);
        }
        entity.setRolesCanWrite(new HashSet<>());
        if (dao.getRolesCanWrite() != null) {
            for (String roleName : dao.getRolesCanWrite()) {
                RoleEntity roleEntity = roleRepository.findByNomRole(roleName)
                        .orElseGet(() -> {
                            RoleEntity r = new RoleEntity();
                            r.setNomRole(roleName);
                            return roleRepository.save(r);
                        });
                entity.getRolesCanWrite().add(roleEntity);
            }
        }
        entity.setRolesCanRead(new HashSet<>());
        if (dao.getRolesCanRead() != null) {
            for (String roleName : dao.getRolesCanRead()) {
                RoleEntity roleEntity = roleRepository.findByNomRole(roleName)
                        .orElseGet(() -> {
                            RoleEntity r = new RoleEntity();
                            r.setNomRole(roleName);
                            return roleRepository.save(r);
                        });
                entity.getRolesCanRead().add(roleEntity);
            }

        }
    }

}
