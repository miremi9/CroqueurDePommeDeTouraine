package fr.croqueurdepommetouraine.demo.Entity;


import jakarta.persistence.*;
import lombok.Data;

@Table(name="role")
@Entity
@Data
public class RoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Long idRole;
    String nomRole;
}
