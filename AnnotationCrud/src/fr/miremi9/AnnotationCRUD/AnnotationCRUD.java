package fr.miremi9.AnnotationCRUD;

import java.lang.annotation.*;

@Target(ElementType.METHOD) // ou TYPE, FIELD, etc.
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AnnotationCRUD {
    String value() default "";
}