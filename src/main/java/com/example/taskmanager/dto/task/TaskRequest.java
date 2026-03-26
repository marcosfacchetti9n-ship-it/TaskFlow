package com.example.taskmanager.dto.task;

import com.example.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "Title is required")
        String title,
        String description,
        @NotNull(message = "Status is required")
        TaskStatus status,
        LocalDate dueDate
) {
}
