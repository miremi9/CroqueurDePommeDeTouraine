package fr.croqueurdepommetouraine.demo.erreurs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(404)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(RequeteIncorrect.class)
    public ResponseEntity<?> handleBadRequest(RequeteIncorrect ex) {
        return ResponseEntity.status(400)
                .body(Map.of("Requete incorrect :", ex.getMessage()));
    }

    @ExceptionHandler(AccesInterditException.class)
    public ResponseEntity<?> handleForbidden(AccesInterditException ex) {
        return ResponseEntity.status(403)
                .body(Map.of("Accès interdit :", ex.getMessage()));
    }

}