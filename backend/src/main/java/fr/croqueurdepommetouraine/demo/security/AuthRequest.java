package fr.croqueurdepommetouraine.demo.security;

import lombok.Data;

@Data
public class AuthRequest {
    private String Nom;
    private String MotDePasse;
}
