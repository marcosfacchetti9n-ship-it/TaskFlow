package com.example.taskmanager.repository;

import com.example.taskmanager.domain.AppUser;
import com.example.taskmanager.domain.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByUserOrderByCreatedAtDesc(AppUser user);

    Optional<Task> findByIdAndUser(Long id, AppUser user);
}
