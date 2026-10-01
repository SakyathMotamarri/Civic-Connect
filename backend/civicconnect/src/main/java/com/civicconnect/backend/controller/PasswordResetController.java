package com.civicconnect.backend.controller;

import com.civicconnect.backend.entity.PasswordResetToken;
import com.civicconnect.backend.entity.User;
import com.civicconnect.backend.repository.PasswordResetTokenRepository;
import com.civicconnect.backend.repository.UserRepository;
import com.civicconnect.backend.service.EmailService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public PasswordResetController(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> request) throws Exception {

        String email = request.get("email");

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(
                    Map.of("message",
                            "If the email exists, a reset link will be sent."));
        }

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        emailService.sendResetEmail(email, token);

        return ResponseEntity.ok(
                Map.of("message", "Password reset email sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request) {

        String token = request.get("token");
        String newPassword = request.get("newPassword");

        PasswordResetToken resetToken =
                tokenRepository.findByToken(token).orElse(null);

        if (resetToken == null ||
                resetToken.isUsed() ||
                resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Invalid or expired reset token."));
        }

        User user = resetToken.getUser();
        user.setPassword(encoder.encode(newPassword));

        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return ResponseEntity.ok(
                Map.of("message", "Password reset successfully."));
    }
}