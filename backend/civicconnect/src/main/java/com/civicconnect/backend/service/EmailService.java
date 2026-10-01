package com.civicconnect.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetEmail(String recipient, String token)
            throws MessagingException {

        String resetLink =
                "http://localhost:5173/reset-password?token=" + token;

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(message, true);

        helper.setFrom(senderEmail);
        helper.setTo(recipient);
        helper.setSubject("CivicConnect Password Reset");

        helper.setText(
                "<h2>CivicConnect Password Reset</h2>" +
                "<p>Click the button below to reset your password.</p>" +
                "<a href='" + resetLink + "'>" +
                "Reset Password</a>" +
                "<p>This link expires in 15 minutes.</p>",
                true
        );

        mailSender.send(message);
    }
}