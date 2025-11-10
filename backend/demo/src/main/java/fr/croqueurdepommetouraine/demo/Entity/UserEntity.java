package fr.croqueurdepommetouraine.demo.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Table(name = "user")
@Entity
@Data
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID idUser;
    @Column(unique = true)
    String nom;
    String motDePasse;
    @ManyToMany(fetch = FetchType.EAGER)
    Set<RoleEntity> roles;
}
