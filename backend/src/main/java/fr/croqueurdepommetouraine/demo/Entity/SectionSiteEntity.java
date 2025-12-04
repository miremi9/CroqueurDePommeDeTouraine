package fr.croqueurdepommetouraine.demo.Entity;


import jakarta.persistence.*;
import lombok.Data;

import java.util.Set;

@Table(name = "section_site")
@Entity
@Data
public class SectionSiteEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Long idSection;
    String nom;
    String path;
    @ManyToOne
    SectionSiteEntity parent;
    Boolean supprimed;
    @ManyToMany(fetch = FetchType.EAGER)
    Set<RoleEntity> rolesCanRead;
    @ManyToMany(fetch = FetchType.EAGER)
    Set<RoleEntity> rolesCanWrite;
}
