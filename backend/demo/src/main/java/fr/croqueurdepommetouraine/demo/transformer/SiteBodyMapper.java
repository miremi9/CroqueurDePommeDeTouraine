package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.SiteBodyDAO;
import fr.croqueurdepommetouraine.demo.Entity.SiteBodyEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SiteBodyMapper {

    // Entity → DAO
    SiteBodyDAO toDAO(SiteBodyEntity entity);

    // DAO → Entity
    @Mapping(target = "id", ignore = true)
    // on ignore l'id lors de la maj
    SiteBodyEntity toEntity(SiteBodyDAO dao);
}