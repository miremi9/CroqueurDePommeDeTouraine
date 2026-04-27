package fr.croqueurdepommetouraine.demo.erreurs;

public class AccesInterditException extends RuntimeException {
    public AccesInterditException(String message) {
        super(message);
    }
}
