package fr.croqueurdepommetouraine.demo.erreurs;

public class InternalErrorException extends RuntimeException {
    public InternalErrorException(String message) {
        super(message);
    }
}
