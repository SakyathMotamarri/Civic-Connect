package com.civicconnect.backend.controller;

import com.civicconnect.backend.entity.Issue;
import com.civicconnect.backend.entity.User;
import com.civicconnect.backend.repository.IssueRepository;
import com.civicconnect.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssueController {

    private final String UPLOAD_DIR = "uploads/";

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createIssue(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("address") String address,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid user ID.");
        }

        Issue issue = new Issue();
        issue.setTitle(title);
        issue.setDescription(description);
        issue.setCategory(category);
        issue.setLatitude(latitude);
        issue.setLongitude(longitude);
        issue.setAddress(address);
        issue.setUser(userOpt.get());

        if (image != null && !image.isEmpty()) {
            try {
                File dir = new File(UPLOAD_DIR);
                if (!dir.exists()) dir.mkdirs();
                String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                Path path = Paths.get(UPLOAD_DIR + fileName);
                Files.copy(image.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                issue.setImageUrl("/uploads/" + fileName);
            } catch (IOException e) {
                return ResponseEntity.status(500).body("Error uploading file: " + e.getMessage());
            }
        }

        issueRepository.save(issue);
        return ResponseEntity.ok(Map.of("message", "Issue reported successfully!", "id", issue.getId()));
    }

    @GetMapping("/all")
    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserIssues(@PathVariable Long userId) {
        return ResponseEntity.ok(issueRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateIssue(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Issue> issueOpt = issueRepository.findById(id);
        if (issueOpt.isEmpty()) return ResponseEntity.notFound().build();

        Issue issue = issueOpt.get();
        if (payload.containsKey("title")) issue.setTitle(payload.get("title"));
        if (payload.containsKey("description")) issue.setDescription(payload.get("description"));
        if (payload.containsKey("status")) issue.setStatus(payload.get("status"));
        if (payload.containsKey("priority")) issue.setPriority(payload.get("priority"));
        issue.setUpdatedAt(LocalDateTime.now());

        issueRepository.save(issue);
        return ResponseEntity.ok(Map.of("message", "Issue updated successfully!"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteIssue(@PathVariable Long id) {
        if (!issueRepository.existsById(id)) return ResponseEntity.notFound().build();
        issueRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Issue deleted successfully."));
    }

    @GetMapping("/analytics/metrics")
    public ResponseEntity<?> getMetrics() {
        long total = issueRepository.count();
        List<Map<String, Object>> statusData = issueRepository.countByStatusGroup();
        List<Map<String, Object>> categoryData = issueRepository.countByCategoryGroup();

        return ResponseEntity.ok(Map.of(
            "totalIssues", total,
            "byStatus", statusData,
            "byCategory", categoryData
        ));
    }
}