package fr.croqueurdepommetouraine.demo.tools;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import lombok.Data;

@Data
public class AuthResponse {
    public String token;
    public UserDAO user;
}