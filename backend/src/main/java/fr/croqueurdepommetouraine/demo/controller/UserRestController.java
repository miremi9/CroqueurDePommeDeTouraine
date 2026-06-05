package fr.croqueurdepommetouraine.demo.controller;

import fr.croqueurdepommetouraine.demo.DAO.UserDAO;
import fr.croqueurdepommetouraine.demo.business.UserBusiness;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@AllArgsConstructor
public class UserRestController {
    UserBusiness userBusiness;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {

        List<UserDAO> users = userBusiness.getAllUsers();
        return ResponseEntity.ok(users);

    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@RequestBody UserDAO userDAO, @PathVariable UUID id, @AuthenticationPrincipal UserDetails userConnect) {
        UserDAO user = userBusiness.updateUser(id, userDAO, userConnect);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userBusiness.forgotPassword(email);
        return ResponseEntity.ok(Map.of(
                "message", "Password reset email sent successfully. Please check your email."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        userBusiness.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of(
                "message", "Password reset successfully"
        ));
    }
}
