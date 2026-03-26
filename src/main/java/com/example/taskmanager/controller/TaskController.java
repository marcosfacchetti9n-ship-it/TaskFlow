package com.example.taskmanager.controller;

import com.example.taskmanager.domain.AppUser;
import com.example.taskmanager.dto.task.TaskRequest;
import com.example.taskmanager.dto.task.TaskResponse;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return taskService.create(request, user);
    }

    @GetMapping
    public List<TaskResponse> findAll(@AuthenticationPrincipal AppUser user) {
        return taskService.findAll(user);
    }

    @GetMapping("/{taskId}")
    public TaskResponse findById(
            @PathVariable Long taskId,
            @AuthenticationPrincipal AppUser user
    ) {
        return taskService.findById(taskId, user);
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return taskService.update(taskId, request, user);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long taskId,
            @AuthenticationPrincipal AppUser user
    ) {
        taskService.delete(taskId, user);
    }
}
