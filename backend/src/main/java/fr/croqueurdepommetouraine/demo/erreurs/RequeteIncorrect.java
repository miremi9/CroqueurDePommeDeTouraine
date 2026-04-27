package fr.croqueurdepommetouraine.demo.erreurs;

public class RequeteIncorrect extends RuntimeException {
    public RequeteIncorrect(String message) {
        super(message);
    }
}
