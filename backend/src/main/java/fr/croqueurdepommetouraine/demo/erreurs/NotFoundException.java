package fr.croqueurdepommetouraine.demo.erreurs;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
