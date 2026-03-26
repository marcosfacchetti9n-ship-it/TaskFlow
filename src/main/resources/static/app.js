const API_BASE = window.APP_CONFIG?.API_BASE || "/api";
const STORAGE_KEY = "task_manager_session";

const state = {
    session: loadSession(),
    tasks: [],
    editingTaskId: null,
    filters: {
        query: "",
        status: "ALL",
        overdueOnly: false,
        sort: "UPDATED_DESC"
    }
};

const elements = {
    registerForm: document.getElementById("registerForm"),
    loginForm: document.getElementById("loginForm"),
    taskForm: document.getElementById("taskForm"),
    logoutButton: document.getElementById("logoutButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    refreshTasksButton: document.getElementById("refreshTasksButton"),
    tasksList: document.getElementById("tasksList"),
    tasksEmptyState: document.getElementById("tasksEmptyState"),
    sessionStatus: document.getElementById("sessionStatus"),
    sessionUser: document.getElementById("sessionUser"),
    editorMode: document.getElementById("editorMode"),
    editorTitle: document.getElementById("editorTitle"),
    toast: document.getElementById("toast"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    overdueFilter: document.getElementById("overdueFilter"),
    sortFilter: document.getElementById("sortFilter"),
    totalTasks: document.getElementById("totalTasks"),
    pendingTasks: document.getElementById("pendingTasks"),
    progressTasks: document.getElementById("progressTasks"),
    completedTasks: document.getElementById("completedTasks"),
    visibleTasks: document.getElementById("visibleTasks"),
    overdueTasks: document.getElementById("overdueTasks"),
    heroCount: document.getElementById("heroCount"),
    taskFeedLabel: document.getElementById("taskFeedLabel")
};

initialize();

function initialize() {
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.taskForm.addEventListener("submit", handleTaskSubmit);
    elements.logoutButton.addEventListener("click", logout);
    elements.cancelEditButton.addEventListener("click", resetTaskEditor);
    elements.refreshTasksButton.addEventListener("click", fetchTasks);
    elements.searchInput.addEventListener("input", handleFilterChange);
    elements.statusFilter.addEventListener("change", handleFilterChange);
    elements.overdueFilter.addEventListener("change", handleFilterChange);
    elements.sortFilter.addEventListener("change", handleFilterChange);

    updateSessionUI();
    updateMetrics([]);
    resetTaskEditor();
    syncFilterControls();

    if (state.session?.token) {
        fetchTasks();
    } else {
        renderTasks();
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(elements.registerForm).entries());

    try {
        const response = await request("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        persistSession(response);
        elements.registerForm.reset();
        showToast("Cuenta creada y sesion iniciada.", "success");
        await fetchTasks();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(elements.loginForm).entries());

    try {
        const response = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        persistSession(response);
        elements.loginForm.reset();
        showToast("Sesion iniciada correctamente.", "success");
        await fetchTasks();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();

    if (!state.session?.token) {
        showToast("Necesitas iniciar sesion antes de guardar tareas.", "error");
        return;
    }

    const formData = new FormData(elements.taskForm);
    const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status"),
        dueDate: formData.get("dueDate") || null
    };

    const editingTaskId = state.editingTaskId;
    const method = editingTaskId ? "PUT" : "POST";
    const path = editingTaskId ? `/tasks/${editingTaskId}` : "/tasks";

    try {
        await request(path, {
            method,
            body: JSON.stringify(payload),
            auth: true
        });
        resetTaskEditor();
        await fetchTasks();
        showToast(editingTaskId ? "Tarea actualizada." : "Tarea creada.", "success");
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function fetchTasks() {
    if (!state.session?.token) {
        state.tasks = [];
        updateMetrics([]);
        renderTasks();
        return;
    }

    try {
        state.tasks = await request("/tasks", { auth: true });
        updateMetrics(state.tasks);
        renderTasks();
    } catch (error) {
        if (error.status === 401) {
            logout(false);
        }
        showToast(error.message, "error");
    }
}

function handleFilterChange() {
    state.filters.query = elements.searchInput.value.trim().toLowerCase();
    state.filters.status = elements.statusFilter.value;
    state.filters.overdueOnly = elements.overdueFilter.checked;
    state.filters.sort = elements.sortFilter.value;
    renderTasks();
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    elements.tasksList.innerHTML = "";
    elements.visibleTasks.textContent = filteredTasks.length;
    elements.heroCount.textContent = filteredTasks.length;
    elements.taskFeedLabel.textContent = state.session?.token
            ? `${filteredTasks.length} visibles`
            : "Sesion requerida";

    if (!state.session?.token) {
        elements.tasksEmptyState.textContent = "Inicia sesion para cargar y administrar tus tareas.";
        elements.tasksEmptyState.style.display = "block";
        return;
    }

    if (!filteredTasks.length) {
        elements.tasksEmptyState.textContent = state.tasks.length
                ? "No hay tareas que coincidan con los filtros actuales."
                : "Todavia no tenes tareas cargadas.";
        elements.tasksEmptyState.style.display = "block";
        return;
    }

    elements.tasksEmptyState.style.display = "none";

    filteredTasks.forEach((task) => {
        const card = document.createElement("article");
        const overdue = isOverdue(task);
        card.className = `task-card${overdue ? " is-overdue" : ""}`;

        const dueText = task.dueDate ? formatDate(task.dueDate) : "Sin fecha limite";
        const updatedText = formatDateTime(task.updatedAt);
        const createdText = formatDateTime(task.createdAt);

        card.innerHTML = `
            <div class="task-card-header">
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                </div>
                <span class="task-status ${getStatusClass(task.status)}">${task.status}</span>
            </div>
            <p class="task-description">${escapeHtml(task.description || "Sin descripcion")}</p>
            <div class="task-pills">
                <span class="pill">Creada ${createdText}</span>
                <span class="pill">Actualizada ${updatedText}</span>
                <span class="pill ${overdue ? "overdue" : ""}">${overdue ? "Vencida" : `Vence ${dueText}`}</span>
            </div>
            <div class="task-card-footer">
                <div class="task-meta">
                    <span>${buildTaskHint(task)}</span>
                </div>
                <div class="task-actions">
                    <button type="button" class="secondary-button" data-action="edit">Editar</button>
                    <button type="button" class="secondary-button" data-action="delete">Eliminar</button>
                </div>
            </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener("click", () => fillTaskEditor(task));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTask(task.id));
        elements.tasksList.appendChild(card);
    });
}

function getFilteredTasks() {
    const tasks = [...state.tasks];
    const query = state.filters.query;

    return tasks
            .filter((task) => {
                if (state.filters.status !== "ALL" && task.status !== state.filters.status) {
                    return false;
                }

                if (state.filters.overdueOnly && !isOverdue(task)) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const haystack = `${task.title} ${task.description || ""}`.toLowerCase();
                return haystack.includes(query);
            })
            .sort(compareByCurrentSort);
}

function compareByCurrentSort(first, second) {
    switch (state.filters.sort) {
        case "DUE_ASC":
            return compareNullableDates(first.dueDate, second.dueDate, 1);
        case "DUE_DESC":
            return compareNullableDates(first.dueDate, second.dueDate, -1);
        case "TITLE_ASC":
            return first.title.localeCompare(second.title);
        case "UPDATED_DESC":
        default:
            return new Date(second.updatedAt) - new Date(first.updatedAt);
    }
}

function compareNullableDates(first, second, direction) {
    if (!first && !second) {
        return 0;
    }
    if (!first) {
        return 1;
    }
    if (!second) {
        return -1;
    }
    return (new Date(first) - new Date(second)) * direction;
}

function fillTaskEditor(task) {
    state.editingTaskId = task.id;
    elements.taskForm.elements.taskId.value = task.id;
    elements.taskForm.elements.title.value = task.title || "";
    elements.taskForm.elements.description.value = task.description || "";
    elements.taskForm.elements.status.value = task.status;
    elements.taskForm.elements.dueDate.value = task.dueDate || "";
    elements.editorMode.textContent = `Editando #${task.id}`;
    elements.editorTitle.textContent = task.title;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetTaskEditor() {
    state.editingTaskId = null;
    elements.taskForm.reset();
    elements.taskForm.elements.taskId.value = "";
    elements.taskForm.elements.status.value = "PENDING";
    elements.editorMode.textContent = "Modo creacion";
    elements.editorTitle.textContent = "Nueva tarea";
}

async function deleteTask(taskId) {
    if (!state.session?.token) {
        return;
    }

    const confirmed = window.confirm("Quieres eliminar esta tarea?");
    if (!confirmed) {
        return;
    }

    try {
        await request(`/tasks/${taskId}`, {
            method: "DELETE",
            auth: true
        });
        if (state.editingTaskId === taskId) {
            resetTaskEditor();
        }
        await fetchTasks();
        showToast("Tarea eliminada.", "success");
    } catch (error) {
        showToast(error.message, "error");
    }
}

function persistSession(session) {
    state.session = session;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    updateSessionUI();
}

function logout(showMessage = true) {
    state.session = null;
    state.tasks = [];
    state.editingTaskId = null;
    localStorage.removeItem(STORAGE_KEY);
    resetTaskEditor();
    updateSessionUI();
    updateMetrics([]);
    renderTasks();
    if (showMessage) {
        showToast("Sesion cerrada.", "success");
    }
}

function updateSessionUI() {
    const hasSession = Boolean(state.session?.token);
    elements.sessionStatus.textContent = hasSession ? "Sesion activa" : "Sin sesion iniciada";
    elements.sessionUser.textContent = hasSession
            ? `${state.session.name} - ${state.session.email}`
            : "No hay usuario autenticado.";
    elements.logoutButton.style.display = hasSession ? "inline-flex" : "none";
}

function updateMetrics(tasks) {
    const pending = tasks.filter((task) => task.status === "PENDING").length;
    const progress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const completed = tasks.filter((task) => task.status === "COMPLETED").length;
    const overdue = tasks.filter((task) => isOverdue(task)).length;

    elements.totalTasks.textContent = tasks.length;
    elements.pendingTasks.textContent = pending;
    elements.progressTasks.textContent = progress;
    elements.completedTasks.textContent = completed;
    elements.visibleTasks.textContent = tasks.length;
    elements.overdueTasks.textContent = overdue;
    elements.heroCount.textContent = tasks.length;
}

function syncFilterControls() {
    elements.searchInput.value = state.filters.query;
    elements.statusFilter.value = state.filters.status;
    elements.overdueFilter.checked = state.filters.overdueOnly;
    elements.sortFilter.value = state.filters.sort;
}

async function request(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (options.auth && state.session?.token) {
        headers.Authorization = `Bearer ${state.session.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const message = buildErrorMessage(data) || `Error ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}

function buildErrorMessage(data) {
    if (!data) {
        return null;
    }

    if (data.validations) {
        return Object.entries(data.validations)
                .map(([field, message]) => `${field}: ${message}`)
                .join(" | ");
    }

    return data.message || data.error || null;
}

function loadSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function showToast(message, type) {
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${type}`;
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        elements.toast.className = "toast";
    }, 3200);
}

function getStatusClass(status) {
    if (status === "COMPLETED") {
        return "status-completed";
    }
    if (status === "IN_PROGRESS") {
        return "status-progress";
    }
    return "status-pending";
}

function isOverdue(task) {
    if (!task.dueDate || task.status === "COMPLETED") {
        return false;
    }

    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return new Date(`${task.dueDate}T00:00:00`) < currentDate;
}

function buildTaskHint(task) {
    if (task.status === "COMPLETED") {
        return "Lista para archivo o revision";
    }
    if (isOverdue(task)) {
        return "Necesita atencion inmediata";
    }
    if (task.status === "IN_PROGRESS") {
        return "Trabajo activo";
    }
    return "Pendiente de ejecucion";
}

function formatDate(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR");
}

function formatDateTime(value) {
    return new Date(value).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function escapeHtml(value) {
    return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
}
