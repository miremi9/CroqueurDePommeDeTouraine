package fr.croqueurdepommetouraine.demo.DAO;

import lombok.Data;

import java.util.List;

@Data
public class SectionDAO {
    Long idSection;
    String nom;
    String path;
    Long idParent;
    Boolean supprimed;
    List<String> rolesCanRead;
    List<String> rolesCanWrite;
}
