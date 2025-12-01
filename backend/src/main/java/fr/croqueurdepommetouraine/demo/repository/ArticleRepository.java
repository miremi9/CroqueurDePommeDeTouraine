package fr.croqueurdepommetouraine.demo.repository;

import fr.croqueurdepommetouraine.demo.Entity.ArticleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArticleRepository extends JpaRepository<ArticleEntity, UUID> {


    List<ArticleEntity> findBySection_IdSection(Long sectionId);

}
