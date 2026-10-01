package com.civicconnect.backend.repository;

import com.civicconnect.backend.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Issue> findByStatus(String status);
    List<Issue> findByCategory(String category);

    @Query("SELECT i.status as status, COUNT(i) as count FROM Issue i GROUP BY i.status")
    List<Map<String, Object>> countByStatusGroup();

    @Query("SELECT i.category as category, COUNT(i) as count FROM Issue i GROUP BY i.category")
    List<Map<String, Object>> countByCategoryGroup();
}