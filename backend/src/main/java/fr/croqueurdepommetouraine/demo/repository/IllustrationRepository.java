package fr.croqueurdepommetouraine.demo.repository;

import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IllustrationRepository extends JpaRepository<IllustrationEntity, UUID> {
}
