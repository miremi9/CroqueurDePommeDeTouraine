package fr.croqueurdepommetouraine.demo.repository;

import fr.croqueurdepommetouraine.demo.Entity.SiteBodyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteBodyRepository extends JpaRepository<SiteBodyEntity, Long> {
}
