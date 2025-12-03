package fr.croqueurdepommetouraine.demo.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Table(name = "article")
@Entity
@Data
public class ArticleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID idArticle;
    @ManyToOne
    @JoinColumn(name = "id_section")
    SectionSiteEntity section;
    String title;
    @Lob
    String content;
    @ManyToOne(fetch = FetchType.EAGER)
    UserEntity author;
    Date dateCreation;
    Boolean changed;
    Boolean supprimed;
    @ManyToMany
    List<IllustrationEntity> pathsImages;
    Boolean supprime;

}
