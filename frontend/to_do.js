document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#task-form");
    const input = document.querySelector("#new_task");
    const deadlineInput = document.querySelector("#task_deadline");
    const listEl = document.querySelector("#tasks");

    function addTaskToDOM(task) {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.draggable = true; // Make task draggable

        const taskContentEl = document.createElement('div');
        taskContentEl.classList.add('content');

        taskEl.appendChild(taskContentEl);

        const taskInputEl = document.createElement('input');
        taskInputEl.classList.add('text');
        taskInputEl.type = 'text';
        taskInputEl.value = task.text;
        taskInputEl.setAttribute('readonly', 'readonly');

        // Check if the deadline has passed
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

        const taskDeleteEl = document.createElement('button');
        taskDeleteEl.classList.add('delete');
        taskDeleteEl.innerHTML = '&times;'; // X symbol

        taskActionsEl.appendChild(taskEditEl);
        taskActionsEl.appendChild(taskDeleteEl);

        taskEl.appendChild(taskActionsEl);

        listEl.appendChild(taskEl);

        taskEditEl.addEventListener('click', () => {
            if (taskEditEl.innerText.toLowerCase() === "edit") {
                taskEditEl.innerText = "Save";
                taskInputEl.removeAttribute("readonly");
                taskInputEl.focus();
            } else {
                taskEditEl.innerText = "Edit";
                taskInputEl.setAttribute("readonly", "readonly");
                updateTask(task.id, taskInputEl.value, task.deadline);
            }
        });

        taskDeleteEl.addEventListener('click', () => {
            deleteTask(task.id, taskEl);
        });

        // Add drag and drop event listeners
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

    function updateTask(taskId, newText, newDeadline) {
        fetch(`http://localhost:5000/Tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newText, deadline: newDeadline }),
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
            console.error('Error:', error);
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
            console.error('Error:', error);
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
        console.error('Error:', error);
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
            deadlineInput.value = ''; // Clear deadline input after adding task
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add task. Please try again.');
        });
    });

    // Function to determine drag position
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
