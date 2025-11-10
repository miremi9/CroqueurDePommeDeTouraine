package fr.croqueurdepommetouraine.demo.DAO;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UserDAO {
    private UUID idUser;
    private String nom;
    private List<String> roles;
}
