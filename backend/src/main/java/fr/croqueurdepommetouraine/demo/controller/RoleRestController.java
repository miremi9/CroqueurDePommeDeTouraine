package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.RoleDAO;
import fr.croqueurdepommetouraine.demo.business.RoleBusiness;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RequiredArgsConstructor
@RestController
@RequestMapping("/roles")
public class RoleRestController {

    private final RoleBusiness roleBusiness;

    @GetMapping
    public ResponseEntity<Set<RoleDAO>> getAllRoles() {
        Set<RoleDAO> roles = roleBusiness.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @PostMapping
    public ResponseEntity<RoleDAO> createRole(@RequestBody RoleDAO roleDAO) {
        RoleDAO createdRole = roleBusiness.createRole(roleDAO);
        return ResponseEntity.status(201).body(createdRole);
    }

    @PutMapping
    public ResponseEntity<RoleDAO> updateRole(@RequestBody RoleDAO roleDAO) {
        RoleDAO updatedRole = roleBusiness.updateRole(roleDAO);
        return ResponseEntity.ok(updatedRole);
    }

}
