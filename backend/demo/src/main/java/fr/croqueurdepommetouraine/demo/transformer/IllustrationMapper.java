package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.IllustrationDAO;
import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface IllustrationMapper {

    @Mapping(source = "idIllustration", target = "idIllustration")
    @Mapping(source = "path", target = "path")
    public IllustrationDAO toDAO(IllustrationEntity entity);

}
