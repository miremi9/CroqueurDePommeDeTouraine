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
    @Mapping(ignore = true, target = "roles")
    public abstract SectionDAO toDAO(SectionSiteEntity entity);

    @AfterMapping
    public void handleParentEntity(SectionSiteEntity entity, @MappingTarget SectionDAO dao) {
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
    public abstract SectionSiteEntity toEntity(SectionDAO dao);

    @AfterMapping
    public void toEntityMappingParentAndRoles(SectionDAO dao, @MappingTarget SectionSiteEntity entity) {
        if (dao.getIdParent() != null) {
            SectionSiteEntity parentEntity = new SectionSiteEntity();
            parentEntity.setIdSection(dao.getIdParent());
            entity.setParent(parentEntity);
        }
        entity.setRoles(new HashSet<>());
        if (dao.getRoles() != null) {
            for (String roleName : dao.getRoles()) {
                RoleEntity roleEntity = roleRepository.findByNomRole(roleName)
                        .orElseGet(() -> {
                            RoleEntity r = new RoleEntity();
                            r.setNomRole(roleName);
                            return roleRepository.save(r);
                        });
                entity.getRoles().add(roleEntity);
            }
        }
    }

}
