package fr.croqueurdepommetouraine.demo.Entity;


import jakarta.persistence.*;
import lombok.Data;

@Table(name = "role")
@Entity
@Data
public class RoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_role")
    Long idRole;

    @Column(name = "nom_role", nullable = false, unique = true)
    String nomRole;
}
