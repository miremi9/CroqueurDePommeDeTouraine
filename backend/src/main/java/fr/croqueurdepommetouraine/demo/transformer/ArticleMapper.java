package fr.croqueurdepommetouraine.demo.transformer;

import fr.croqueurdepommetouraine.demo.DAO.ArticleDAO;
import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.ArrayList;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface ArticleMapper {

    @Mapping(source = "section.idSection", target = "idSection")
    @Mapping(source = "author.idUser", target = "idAuthor")
    @Mapping(source = "author.nom", target = "authorName")
    ArticleDAO toDAO(ArticleEntity entity);

    @AfterMapping
    default void handlePathsImagesAfterMapping(ArticleEntity entity, @MappingTarget ArticleDAO dao) {
        if (entity.getPathsImages() == null) {
            return;
        }
        dao.setIdIllustrationDAOS(entity.getPathsImages()
                .stream()
                .map(IllustrationEntity::getIdIllustration)
                .toList());
    }


    @Mapping(source = "idSection", target = "section.idSection")
    @Mapping(source = "title", target = "title")
    @Mapping(source = "content", target = "content")
    @Mapping(source = "idArticle", target = "idArticle")
    @Mapping(source = "dateCreation", target = "dateCreation")
    @Mapping(source = "changed", target = "changed")
    @Mapping(source = "supprimed", target = "supprimed")
    ArticleEntity toEntity(ArticleDAO dao);

    @AfterMapping
    default void handlePathsImagesAfterMapping(ArticleDAO dao, @MappingTarget ArticleEntity entity) {
        if (dao.getIdAuthor() != null) {
            UserEntity user = new UserEntity();
            user.setIdUser(dao.getIdAuthor());
            user.setNom(dao.getAuthorName());
            entity.setAuthor(user);
        }
        SectionSiteEntity section = new SectionSiteEntity();
        section.setIdSection(dao.getIdSection());
        entity.setSection(section);
        if (dao.getIdIllustrationDAOS() == null) {
            return;
        }
        entity.setPathsImages(new ArrayList<>());
        for (UUID idIllustration : dao.getIdIllustrationDAOS()) {
            IllustrationEntity illustration = new IllustrationEntity();
            illustration.setIdIllustration(idIllustration);
            entity.getPathsImages().add(illustration);
        }
    }


}
