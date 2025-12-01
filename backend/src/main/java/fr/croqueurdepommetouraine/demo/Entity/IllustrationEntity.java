package fr.croqueurdepommetouraine.demo.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Table(name = "illustration")
@Entity
@Data
public class IllustrationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID idIllustration;
    String path;

}
