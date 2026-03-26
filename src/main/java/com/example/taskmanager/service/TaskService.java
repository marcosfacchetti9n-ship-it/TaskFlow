package com.example.taskmanager.service;

import com.example.taskmanager.domain.AppUser;
import com.example.taskmanager.domain.Task;
import com.example.taskmanager.dto.task.TaskRequest;
import com.example.taskmanager.dto.task.TaskResponse;
import com.example.taskmanager.exception.ResourceNotFoundException;
import com.example.taskmanager.repository.TaskRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse create(TaskRequest request, AppUser user) {
        LocalDateTime now = LocalDateTime.now();

        Task task = taskRepository.save(
                Task.builder()
                        .title(request.title())
                        .description(request.description())
                        .status(request.status())
                        .dueDate(request.dueDate())
                        .createdAt(now)
                        .updatedAt(now)
                        .user(user)
                        .build()
        );

        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findAll(AppUser user) {
        return taskRepository.findAllByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(Long taskId, AppUser user) {
        return mapToResponse(getTaskByIdAndUser(taskId, user));
    }

    @Transactional
    public TaskResponse update(Long taskId, TaskRequest request, AppUser user) {
        Task task = getTaskByIdAndUser(taskId, user);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setDueDate(request.dueDate());
        task.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long taskId, AppUser user) {
        Task task = getTaskByIdAndUser(taskId, user);
        taskRepository.delete(task);
    }

    private Task getTaskByIdAndUser(Long taskId, AppUser user) {
        return taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
