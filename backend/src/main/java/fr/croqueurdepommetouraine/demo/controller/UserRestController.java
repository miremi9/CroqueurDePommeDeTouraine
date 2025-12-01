package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.business.UserBusiness;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@AllArgsConstructor
public class UserRestController {
    UserBusiness userBusiness;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserDAO> users = userBusiness.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(500)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@RequestBody UserDAO userDAO, @PathVariable UUID id, @AuthenticationPrincipal UserDetails userConnect) {
        try {
            UserDAO user = userBusiness.updateUser(id, userDAO, userConnect);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body("Invalid parameter: " + e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity
                    .status(404)
                    .body("User not found: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(500)
                    .body("Internal server error: " + e.getMessage());
        }

    }
}
