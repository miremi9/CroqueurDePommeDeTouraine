package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.RoleDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    @Mapping(source = "idRole", target = "idRole")
    @Mapping(source = "nomRole", target = "nomRole")
    public RoleDAO toDAO(RoleEntity entity);

    @Mapping(source = "idRole", target = "idRole")
    @Mapping(source = "nomRole", target = "nomRole")
    public RoleEntity toEntity(RoleDAO dao);

}
