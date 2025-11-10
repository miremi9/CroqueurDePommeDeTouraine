package fr.croqueurdepommetouraine.demo.repository;

import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    UserEntity findByNom(String nom);

}
