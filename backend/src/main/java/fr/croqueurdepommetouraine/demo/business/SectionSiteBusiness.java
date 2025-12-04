package fr.croqueurdepommetouraine.demo.business;


import fr.croqueurdepommetouraine.demo.DAO.SectionDAO;
import fr.croqueurdepommetouraine.demo.Entity.SectionSiteEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.SectionRepository;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import fr.croqueurdepommetouraine.demo.tools.ToolsAuthorisationEndPoint;
import fr.croqueurdepommetouraine.demo.transformer.RoleMapper;
import fr.croqueurdepommetouraine.demo.transformer.SectionMapper;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@AllArgsConstructor
public class SectionSiteBusiness {

    private final SectionMapper sectionMapper;
    private final RoleMapper roleMapper;
    private final SectionRepository SectionRepository;
    private final UserRepository userRepository;
    private final RoleBusiness roleBusiness;
    private final ToolsAuthorisationEndPoint toolsAuthorisationEndPoint;


    public SectionDAO createSection(SectionDAO section) {

        SectionSiteEntity newSection = sectionMapper.toEntity(section);
        // Gestion du parent
        gestionParent(newSection);

        //Gestion des rôles
        gestionRole(newSection);
        //check if path is url friendly
        makeSectionValid(newSection);
        section.setIdSection(null);
        SectionSiteEntity createdSection = SectionRepository.save(newSection);
        return sectionMapper.toDAO(createdSection);
    }

    private void gestionRole(SectionSiteEntity section) {
        if (section.getRolesCanRead() != null) {
            section.setRolesCanRead(
                    section.getRolesCanRead().stream()
                            .map(r -> roleMapper.toEntity(roleBusiness.getRoleByName(r.getNomRole())))
                            .collect(Collectors.toSet()));
        }
        section.getRolesCanRead().add(roleMapper.toEntity(roleBusiness.getRoleByName(ROLES.ROLE_ADMIN)));
        if (section.getRolesCanWrite() != null) {
            section.setRolesCanWrite(
                    section.getRolesCanWrite().stream()
                            .map(r -> roleMapper.toEntity(roleBusiness.getRoleByName(r.getNomRole())))
                            .collect(Collectors.toSet()));
        }
    }

    private void gestionParent(SectionSiteEntity section) {
        if (section.getParent() != null) {
            Optional<SectionSiteEntity> parent = SectionRepository.findById(section.getParent().getIdSection());
            if (parent.isEmpty()) {
                throw new NoSuchElementException("Parent section with id " + section.getParent().getIdSection() + " not found.");
            }
            section.setParent(parent.get());

        }
    }

    private void makeSectionValid(SectionSiteEntity section) {
        if (section.getPath() == null || section.getPath().isBlank()) {
            throw new IllegalArgumentException("Section path cannot be null or blank.");
        }
        if (section.getParent() != null) {
            if (section.getParent().getParent() != null) {
                throw new IllegalArgumentException("Le parent de la section ne peut pas avoir de parent");
            }
        }
        String path = section.getPath();
        String urlFriendlyPath = path.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        section.setPath(urlFriendlyPath);


    }

    public List<SectionDAO> getAllSections(String authHeader) {
        UserEntity user = toolsAuthorisationEndPoint.getUserFromHeader(authHeader);
        return SectionRepository.findAll()
                .stream()
                .filter(s -> toolsAuthorisationEndPoint.CanReadSection(s, user))
                .filter(s -> !Boolean.TRUE.equals(s.getSupprimed())) // on ignore les supprimées
                .map(sectionMapper::toDAO)
                .toList();
    }

    public SectionDAO getSectionByIdWithAuth(Long id, String authHeader) {

        Optional<SectionSiteEntity> section = SectionRepository.findById(id);
        if (section.isEmpty() || Boolean.TRUE.equals(section.get().getSupprimed())) {
            throw new NoSuchElementException("Section with id " + id + " not found.");
        }
        if (!toolsAuthorisationEndPoint.CanReadThisSection(authHeader, id)) {
            throw new IllegalArgumentException("Pas les droits necessaires pour acceder a la section");
        }
        return sectionMapper.toDAO(section.get());
    }

    public SectionDAO getSectionById(Long id) {

        Optional<SectionSiteEntity> section = SectionRepository.findById(id);
        if (section.isEmpty() || Boolean.TRUE.equals(section.get().getSupprimed())) {
            throw new NoSuchElementException("Section with id " + id + " not found.");
        }
        return sectionMapper.toDAO(section.get());
    }

    public SectionDAO updateSection(Long id, SectionDAO updated) {

        //Check if exist
        if (!Objects.equals(id, updated.getIdSection())) {
            throw new IllegalArgumentException("Id de la section et en parametre sont different");
        }
        Optional<SectionSiteEntity> originale = SectionRepository.findById(id);
        if (!originale.isPresent()) {
            throw new IllegalArgumentException("Section with id " + id + " not found.");
        }
        SectionSiteEntity section = sectionMapper.toEntity(updated);
        makeSectionValid(section);
        gestionRole(section);
        gestionParent(section);
        SectionSiteEntity entity = SectionRepository.save(section);
        return sectionMapper.toDAO(entity);
    }

    public boolean deleteSection(Long id) {
        Optional<SectionSiteEntity> sectionOpt = SectionRepository.findById(id);
        if (sectionOpt.isPresent()) {
            SectionSiteEntity section = sectionOpt.get();
            section.setSupprimed(true);
            SectionRepository.save(section);
            return true;
        }
        return false;
    }
}


