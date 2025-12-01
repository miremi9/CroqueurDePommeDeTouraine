package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.Entity.RoleEntity;
import fr.croqueurdepommetouraine.demo.Entity.UserEntity;
import fr.croqueurdepommetouraine.demo.repository.RoleRepository;
import fr.croqueurdepommetouraine.demo.repository.UserRepository;
import fr.croqueurdepommetouraine.demo.security.ROLES;
import fr.croqueurdepommetouraine.demo.transformer.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserBusiness implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

    public List<UserDAO> getAllUsers() {
        List<UserEntity> users = userRepository.findAll();
        return users.stream()
                .map(userMapper::toDAO)
                .toList();
    }

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findByNom(username);

        if (userEntity == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        List<SimpleGrantedAuthority> listeRoles = userEntity.getRoles().stream()
                .map(roleEntity -> new SimpleGrantedAuthority(roleEntity.getNomRole()))
                .toList();
        return new User(userEntity.getNom(), userEntity.getMotDePasse(), listeRoles);
    }

    public UserEntity getUserByNom(String nom) {
        UserEntity userEntity = userRepository.findByNom(nom);
        if (userEntity == null) {
            throw new UsernameNotFoundException("User not found with username: " + nom);
        }
        return userEntity;
    }

    private UserEntity saveUser(UserEntity userEntity) {
        if (userRepository.findByNom(userEntity.getNom()) != null) {
            throw new IllegalArgumentException("User already exists with username: " + userEntity.getNom());
        } else {
            if (Objects.equals(userEntity.getNom(), "admin")) {
                RoleEntity adminRole = roleRepository.findByNomRole(ROLES.ROLE_ADMIN)
                        .orElseThrow(() -> new IllegalArgumentException("Admin role not found"));
                userEntity.setRoles(Set.of(adminRole));
            } else {
                RoleEntity userRole = roleRepository.findByNomRole(ROLES.ROLE_USER)
                        .orElseThrow(() -> new IllegalArgumentException("User role not found"));
                userEntity.setRoles(Set.of(userRole));
            }
            String encodedPassword = passwordEncoder.encode(userEntity.getMotDePasse());
            userEntity.setMotDePasse(encodedPassword);
            return userRepository.save(userEntity);
        }
    }

    public UserEntity registerUser(String nom, String motDePasse) {
        UserEntity newUser = new UserEntity();
        newUser.setNom(nom);
        newUser.setMotDePasse(motDePasse);
        return saveUser(newUser);
    }

    public UserDAO updateUser(UUID id, UserDAO userDAO, UserDetails userConnect) {
        UserEntity existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        //Si tentative de destituer admin
        if (existingUser.getRoles().stream().anyMatch(r -> Objects.equals(r.getNomRole(), ROLES.ROLE_ADMIN)) &&
                userDAO.getRoles().stream().noneMatch(r -> Objects.equals(r, ROLES.ROLE_ADMIN))) {
            throw new IllegalArgumentException("Impossible de destituer un admin");
        }
        UserEntity updatedUser = userMapper.toEntity(userDAO);
        if (updatedUser.getNom() == null) {
            throw new IllegalArgumentException("Username cannot be null");
        }
        existingUser.setNom(updatedUser.getNom());
        existingUser.setRoles(updatedUser.getRoles());

        Set<RoleEntity> attachedRoles = updatedUser.getRoles().stream()
                .map(role -> roleRepository.findByNomRole(role.getNomRole())
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + role.getNomRole())))
                .collect(Collectors.toSet());


        existingUser.setRoles(attachedRoles);
        updatedUser = userRepository.save(existingUser);
        return userMapper.toDAO(updatedUser);
    }


}
