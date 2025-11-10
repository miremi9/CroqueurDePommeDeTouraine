package fr.croqueurdepommetouraine.demo.tools;


import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class FilesGestion {
    public static void saveFile(InputStream inputStream, Path destinationPath) {
        if (destinationPath == null) {
            throw new IllegalArgumentException("Invalid destination path");
        }


        try {
            // Créer le dossier parent si nécessaire
            Path parentDir = destinationPath.getParent();
            if (parentDir != null && !Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
            }

            // Copier le flux d’entrée vers le fichier de destination
            Files.copy(inputStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);

        } catch (IOException e) {
            throw new RuntimeException("Failed to save file to: " + destinationPath, e);
        }
    }

    public static Resource loadFileAsResource(Path path) throws IOException {

        if (!Files.exists(path)) {
            throw new IOException("File not found: " + path.toString());
        }
        return new UrlResource(path.toUri());
    }
}
