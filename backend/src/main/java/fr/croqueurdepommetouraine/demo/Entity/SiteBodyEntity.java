package fr.croqueurdepommetouraine.demo.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Table(name = "siteBody")
@Entity
@Data
public class SiteBodyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Long id;
    String titre;
    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    String BasDePage;
    @Column(columnDefinition = "MEDIUMTEXT")
    @Lob
    String logo;
    String CouleurPrincipale;
    String CouleurSecondaire;
}
