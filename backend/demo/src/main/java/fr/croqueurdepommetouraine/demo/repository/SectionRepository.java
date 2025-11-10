package fr.croqueurdepommetouraine.demo.repository;

import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepository extends JpaRepository<SectionSiteEntity, Long> {

}
