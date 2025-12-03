package fr.croqueurdepommetouraine.demo.business;


import fr.croqueurdepommetouraine.demo.DAO.IllustrationDAO;
import fr.croqueurdepommetouraine.demo.Entity.IllustrationEntity;
import fr.croqueurdepommetouraine.demo.repository.IllustrationRepository;
import fr.croqueurdepommetouraine.demo.tools.FilesGestion;
import fr.croqueurdepommetouraine.demo.transformer.IllustrationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IllustrationBusiness {
    @Value("${app.upload.dir}")
    private String UPLOAD_DIR;
    private final IllustrationMapper illustrationMapper;
    private final IllustrationRepository illustrationRepository;


    public IllustrationDAO createIllustration(MultipartFile file) throws IOException {

        Path uploadPath = Paths.get(UPLOAD_DIR);
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);

        FilesGestion.saveFile(file.getInputStream(), filePath);

        IllustrationEntity illustrationEntity = new IllustrationEntity();
        illustrationEntity.setPath(fileName);

        illustrationEntity = illustrationRepository.save(illustrationEntity);
        return illustrationMapper.toDAO(illustrationEntity);

    }

    public IllustrationDAO getIllustrationDAOById(UUID idIllustration) {
        IllustrationEntity illustrationEntity = illustrationRepository.findById(idIllustration)
                .orElseThrow(() -> new RuntimeException("Illustration not found with id: " + idIllustration));
        return illustrationMapper.toDAO(illustrationEntity);
    }

    public Resource getIllustrationById(UUID idIllustration) throws IOException {

        IllustrationEntity illustrationEntity = illustrationRepository.findById(idIllustration)
                .orElseThrow(() -> new RuntimeException("Illustration not found with id: " + idIllustration));

        Path path = Paths.get(illustrationEntity.getPath());
        path = Paths.get(UPLOAD_DIR).resolve(path);

        return FilesGestion.loadFileAsResource(path);
    }
}
