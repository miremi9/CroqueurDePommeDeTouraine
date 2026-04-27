package fr.croqueurdepommetouraine.demo.business;

import fr.croqueurdepommetouraine.demo.DAO.SiteBodyDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SiteBodyBusiness siteBodyBusiness;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        SiteBodyDAO siteBodyDAO = siteBodyBusiness.getSiteBody();
        String NomSite = siteBodyDAO.getTitre() != null ? siteBodyDAO.getTitre() : "Titre Generique";
        String UrlSite = siteBodyDAO.getUrl();

        SimpleMailMessage message = new SimpleMailMessage();

        if (UrlSite == null || UrlSite.isEmpty()) {
            message.setText("Bonjour,\n\n" +
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                    "Voici votre token de réinitialisation : " + resetToken + "\n\n" +
                    "Ce token est valide pendant 1 heure.\n\n" +
                    "Pour réinitialiser votre mot de passe, utilisez ce token dans l'application.\n\n" +
                    "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n" +
                    "Cordialement");
        }
        else {
            message.setText("Bonjour,\n\n" +
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                    "Voici votre lien de réinitialisation : " + UrlSite + "/reset-password?token=" + resetToken + "\n\n" +
                    "Ce lien est valide pendant 1 heure.\n\n" +
                    "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n" +
                    "Cordialement");
        }
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de votre mot de passe - " + NomSite);


        mailSender.send(message);
    }
}
