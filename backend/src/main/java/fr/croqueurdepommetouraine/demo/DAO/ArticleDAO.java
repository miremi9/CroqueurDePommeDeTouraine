package fr.croqueurdepommetouraine.demo.DAO;

import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
public class ArticleDAO {
    UUID idArticle;
    Long idSection;
    String title;
    String content;
    UUID idAuthor;
    String authorName;
    Date dateCreation;
    Boolean changed;
    Boolean supprimed;
    List<UUID> idIllustrationDAOS;
}
