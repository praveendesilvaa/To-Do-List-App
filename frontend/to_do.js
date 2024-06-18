document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#task-form");
    const input = document.querySelector("#new_task");
    const deadlineInput = document.querySelector("#task_deadline");
    const listEl = document.querySelector("#tasks");
    const clockEl = document.querySelector("#clock");

    // Function to update the clock
    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const currentDate = now.toDateString();

        clockEl.innerHTML = `
            <div class="time">${hours}:${minutes}:${seconds}</div>
            <div class="date">${currentDate}</div>
        `;
    }

    // Update the clock immediately upon DOM content loaded
    updateClock();

    // Update the clock every second
    setInterval(updateClock, 1000);

    // Function to add a task element to the DOM
    function addTaskToDOM(task) {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.draggable = true;

        const taskContentEl = document.createElement('div');
        taskContentEl.classList.add('content');

        taskEl.appendChild(taskContentEl);

        const taskCompletedEl = document.createElement('input');
        taskCompletedEl.classList.add('completed-checkbox');
        taskCompletedEl.type = 'checkbox';
        taskCompletedEl.checked = task.completed;

        taskContentEl.appendChild(taskCompletedEl);

        const taskInputEl = document.createElement('input');
        taskInputEl.classList.add('text');
        taskInputEl.type = 'text';
        taskInputEl.value = task.text;
        taskInputEl.setAttribute('readonly', 'readonly');

        const deadlinePassed = task.deadline && new Date(task.deadline) < new Date();
        if (deadlinePassed) {
            taskInputEl.classList.add('deadline-passed');
        }

        taskContentEl.appendChild(taskInputEl);

        const taskDateEl = document.createElement('div');
        taskDateEl.classList.add('date');
        taskDateEl.innerText = `Created: ${new Date(task.created_at).toLocaleDateString()}${task.deadline ? ` | Deadline: ${new Date(task.deadline).toLocaleDateString()}` : ''}`;

        taskContentEl.appendChild(taskDateEl);

        const taskActionsEl = document.createElement('div');
        taskActionsEl.classList.add('actions');

        const taskEditEl = document.createElement('button');
        taskEditEl.classList.add('edit');
        taskEditEl.innerText = 'Edit';

        const taskCompleteEl = document.createElement('button');
        taskCompleteEl.classList.add('complete');
        taskCompleteEl.innerText = '✓';

        const taskDeleteEl = document.createElement('button');
        taskDeleteEl.classList.add('delete');
        taskDeleteEl.innerHTML = '&times;';

        taskActionsEl.appendChild(taskEditEl);
        taskActionsEl.appendChild(taskCompleteEl);
        taskActionsEl.appendChild(taskDeleteEl);

        taskEl.appendChild(taskActionsEl);

        listEl.appendChild(taskEl);

        // Event listener for the edit button
        taskEditEl.addEventListener('click', () => {
            if (taskEditEl.innerText.toLowerCase() === "edit") {
                taskEditEl.innerText = "Save";
                taskInputEl.removeAttribute("readonly");
                taskInputEl.focus();
            } else {
                const newText = taskInputEl.value.trim();
                const newDeadline = task.deadline;
                const newCompleted = taskCompletedEl.checked;
                if (newText === '') {
                    alert('Task cannot be empty!');
                    return;
                }
                taskEditEl.innerText = "Edit";
                taskInputEl.setAttribute("readonly", "readonly");
                updateTask(task.id, newText, newDeadline, newCompleted);
            }
        });

        // Event listener for the mark as completed button
        taskCompleteEl.addEventListener('click', () => {
            taskCompletedEl.checked = true;
            updateTask(task.id, task.text, task.deadline, true);
            taskInputEl.classList.add('completed');
            taskEl.classList.add('completed');
        });

        // Event listener for the delete button
        taskDeleteEl.addEventListener('click', () => {
            deleteTask(task.id, taskEl);
        });

        // Initialize task completion style
        if (task.completed) {
            taskInputEl.classList.add('completed');
            taskEl.classList.add('completed');
        }

        // Event listeners for drag and drop functionality
        taskEl.addEventListener('dragstart', () => {
            taskEl.classList.add('dragging');
        });

        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging');
        });

        listEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(listEl, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                listEl.appendChild(draggable);
            } else {
                listEl.insertBefore(draggable, afterElement);
            }
        });
    }

    function updateTask(taskId, newText, newDeadline, newCompleted) {
        fetch(`http://localhost:5000/Tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newText, deadline: newDeadline, completed: newCompleted }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task updated:', data);
        })
        .catch(error => {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        });
    }

    function deleteTask(taskId, taskElement) {
        fetch(`http://localhost:5000/Tasks/${taskId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task deleted:', data);
            listEl.removeChild(taskElement);
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
        });
    }

    fetch('http://localhost:5000/Tasks')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        data.forEach(task => {
            addTaskToDOM(task);
        });
    })
    .catch(error => {
        console.error('Error fetching tasks:', error);
        alert('Failed to fetch tasks. Please refresh the page.');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskText = input.value.trim();
        const taskDeadline = deadlineInput.value.trim();

        if (taskText === '') {
            alert('Task cannot be empty!');
            return;
        }

        fetch('http://localhost:5000/Tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: taskText, deadline: taskDeadline }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(task => {
            addTaskToDOM(task);
            input.value = '';
            deadlineInput.value = '';
        })
        .catch(error => {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

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
});
