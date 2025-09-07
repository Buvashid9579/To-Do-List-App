// DOM elements
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const prioritySelect = document.getElementById('priority-select');
const categoryInput = document.getElementById('category-input');
const addTaskBtn = document.getElementById('add-task-btn');
const todoList = document.getElementById('todo-list');
const messageBox = document.getElementById('message-box');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortBySelect = document.getElementById('sort-by');

// This array simulates our "database" for deleted tasks, allowing for restoration.
let deletedTasks = [];

/**
 * Updates the progress bar and completion percentage.
 */
function updateProgress() {
    const totalTasks = todoList.querySelectorAll('li').length;
    const completedTasks = todoList.querySelectorAll('li.completed').length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${percentage}% Complete`;
}

/**
 * Shows a temporary message to the user.
 * @param {string} message - The message to display.
 */
function showMessage(message) {
    messageBox.innerHTML = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

/**
 * Creates a new list item for a task.
 * @param {string} taskText - The text content of the task.
 * @param {string} [dueDate=''] - The due date of the task.
 * @param {string} [priority='low'] - The priority of the task.
 * @param {string} [category=''] - The category of the task.
 * @param {boolean} [completed=false] - The completion status of the task.
 * @returns {HTMLLIElement} The created list item element.
 */
function createListItem(taskText, dueDate = '', priority = 'low', category = '', completed = false) {
    const li = document.createElement('li');
    li.setAttribute('data-task-id', Date.now());
    li.setAttribute('data-priority', priority);
    li.setAttribute('data-category', category);
    li.setAttribute('data-due-date', dueDate);
    li.setAttribute('draggable', 'true');
    if (completed) {
        li.classList.add('completed');
    }

    const taskDetailsDiv = document.createElement('div');
    taskDetailsDiv.className = 'task-details';

    const priorityIcon = document.createElement('i');
    priorityIcon.className = 'priority-icon fas';
    switch (priority) {
        case 'high':
            priorityIcon.classList.add('fa-fire', 'priority-high');
            break;
        case 'medium':
            priorityIcon.classList.add('fa-bolt', 'priority-medium');
            break;
        case 'low':
        default:
            priorityIcon.classList.add('fa-clock', 'priority-low');
            break;
    }
    
    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.textContent = taskText;

    const taskInfoDiv = document.createElement('div');
    taskInfoDiv.className = 'task-info';
    taskInfoDiv.innerHTML = `
        <span class="category-info">Category: ${category || 'N/A'}</span>
        <span class="due-date-info">Due: ${dueDate || 'N/A'}</span>
    `;

    taskDetailsDiv.appendChild(priorityIcon);
    taskDetailsDiv.appendChild(taskTextSpan);
    taskDetailsDiv.appendChild(taskInfoDiv);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'complete-btn';
    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
    completeBtn.title = 'Mark as Complete';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.title = 'Delete Task';

    actionsContainer.appendChild(completeBtn);
    actionsContainer.appendChild(deleteBtn);
    
    li.appendChild(taskDetailsDiv);
    li.appendChild(actionsContainer);

    return li;
}

/**
 * Adds a new task to the list with all its details.
 */
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        showMessage('Task cannot be empty.');
        return;
    }

    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;
    const category = categoryInput.value.trim();

    const li = createListItem(taskText, dueDate, priority.toLowerCase(), category);
    todoList.appendChild(li);
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'low';
    categoryInput.value = '';

    updateProgress();
}

/**
 * Handles events on the To-Do list, such as deleting, completing, or editing a task.
 * @param {Event} event - The click event object.
 */
function handleListAction(event) {
    const target = event.target;
    const listItem = target.closest('li');

    if (!listItem) return;

    if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
        const task = {
            id: listItem.getAttribute('data-task-id'),
            text: listItem.querySelector('.task-text').textContent,
            dueDate: listItem.getAttribute('data-due-date'),
            priority: listItem.getAttribute('data-priority'),
            category: listItem.getAttribute('data-category'),
            completed: listItem.classList.contains('completed')
        };
        deletedTasks.push(task);
        listItem.remove();
        
        messageBox.innerHTML = `
            Task deleted.
            <button class="restore-btn" onclick="restoreLastTask()">Restore</button>
        `;
        messageBox.classList.add('show');
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, 5000);
        updateProgress();

    } else if (target.classList.contains('complete-btn') || target.closest('.complete-btn')) {
        listItem.classList.toggle('completed');
        updateProgress();
    }
}

/**
 * Restores the last deleted task.
 */
function restoreLastTask() {
    if (deletedTasks.length === 0) {
        showMessage('No tasks to restore.');
        return;
    }
    
    const lastTask = deletedTasks.pop();
    const li = createListItem(lastTask.text, lastTask.dueDate, lastTask.priority, lastTask.category, lastTask.completed);

    const children = todoList.children;
    if (lastTask.index !== undefined && lastTask.index < children.length) {
        todoList.insertBefore(li, children[lastTask.index]);
    } else {
        todoList.appendChild(li);
    }
    
    messageBox.classList.remove('show');
    updateProgress();
}

// Drag and Drop Logic
let draggedItem = null;

todoList.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    setTimeout(() => {
        draggedItem.classList.add('dragging');
    }, 0);
});

todoList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(todoList, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        todoList.appendChild(draggable);
    } else {
        todoList.insertBefore(draggable, afterElement);
    }
});

todoList.addEventListener('dragend', () => {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// In-place editing logic
todoList.addEventListener('dblclick', (e) => {
    const target = e.target;
    const listItem = target.closest('li');
    if (!listItem) return;

    if (target.classList.contains('task-text')) {
        const originalText = target.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;

        target.parentNode.replaceChild(input, target);
        input.focus();

        input.addEventListener('blur', () => {
            const newText = input.value.trim();
            if (newText === '') {
                showMessage('Task text cannot be empty.');
                input.value = originalText;
                input.focus();
                return;
            }
            const span = document.createElement('span');
            span.className = 'task-text';
            span.textContent = newText;
            input.parentNode.replaceChild(span, input);
        });

        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                input.blur();
            }
        });
    }
});

// Search and Filter Logic
function filterAndSortTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const sortBy = sortBySelect.value;
    
    let tasks = Array.from(todoList.children);

    // Filter tasks
    tasks.forEach(task => {
        const text = task.querySelector('.task-text').textContent.toLowerCase();
        const isCompleted = task.classList.contains('completed');
        const isMatch = text.includes(searchTerm);

        let isVisible = false;
        if (activeFilter === 'all') {
            isVisible = isMatch;
        } else if (activeFilter === 'pending') {
            isVisible = isMatch && !isCompleted;
        } else if (activeFilter === 'completed') {
            isVisible = isMatch && isCompleted;
        }

        task.style.display = isVisible ? 'flex' : 'none';
    });

    // Sort tasks
    if (sortBy === 'priority') {
        tasks.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const priorityA = priorityOrder[a.dataset.priority] || 0;
            const priorityB = priorityOrder[b.dataset.priority] || 0;
            return priorityB - priorityA;
        });
    } else if (sortBy === 'dueDate') {
        tasks.sort((a, b) => {
            const dateA = new Date(a.dataset.dueDate);
            const dateB = new Date(b.dataset.dueDate);
            return dateA - dateB;
        });
    }

    // Re-append sorted tasks
    tasks.forEach(task => todoList.appendChild(task));
}


// Event listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});
todoList.addEventListener('click', handleListAction);
searchInput.addEventListener('input', filterAndSortTasks);
sortBySelect.addEventListener('change', filterAndSortTasks);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndSortTasks();
    });
});
