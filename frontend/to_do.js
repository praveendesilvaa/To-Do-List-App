document.addEventListener('DOMContentLoaded', () => {
    // Select the form, input fields, and the task list container
    const form = document.querySelector("#task-form");
    const input = document.querySelector("#new_task");
    const deadlineInput = document.querySelector("#task_deadline");
    const listEl = document.querySelector("#tasks");

    // Function to add a task element to the DOM
    function addTaskToDOM(task) {
        // Create a task container element
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.draggable = true; // Make the task draggable

        // Create a container for the task content
        const taskContentEl = document.createElement('div');
        taskContentEl.classList.add('content');

        // Append the content container to the task element
        taskEl.appendChild(taskContentEl);

        // Create an input element for the task text
        const taskInputEl = document.createElement('input');
        taskInputEl.classList.add('text');
        taskInputEl.type = 'text';
        taskInputEl.value = task.text;
        taskInputEl.setAttribute('readonly', 'readonly'); // Make it read-only initially

        // Check if the deadline has passed and add a class if true
        const deadlinePassed = task.deadline && new Date(task.deadline) < new Date();
        if (deadlinePassed) {
            taskInputEl.classList.add('deadline-passed');
        }

        // Append the task text input to the content container
        taskContentEl.appendChild(taskInputEl);

        // Create an element for the task creation and deadline dates
        const taskDateEl = document.createElement('div');
        taskDateEl.classList.add('date');
        taskDateEl.innerText = `Created: ${new Date(task.created_at).toLocaleDateString()}${task.deadline ? ` | Deadline: ${new Date(task.deadline).toLocaleDateString()}` : ''}`;

        // Append the date information to the content container
        taskContentEl.appendChild(taskDateEl);

        // Create a container for the action buttons
        const taskActionsEl = document.createElement('div');
        taskActionsEl.classList.add('actions');

        // Create the edit button
        const taskEditEl = document.createElement('button');
        taskEditEl.classList.add('edit');
        taskEditEl.innerText = 'Edit';

        // Create the delete button
        const taskDeleteEl = document.createElement('button');
        taskDeleteEl.classList.add('delete');
        taskDeleteEl.innerHTML = '&times;'; // X symbol

        // Append the edit and delete buttons to the actions container
        taskActionsEl.appendChild(taskEditEl);
        taskActionsEl.appendChild(taskDeleteEl);

        // Append the actions container to the task element
        taskEl.appendChild(taskActionsEl);

        // Append the task element to the task list
        listEl.appendChild(taskEl);

        // Event listener for the edit button
        taskEditEl.addEventListener('click', () => {
            if (taskEditEl.innerText.toLowerCase() === "edit") {
                taskEditEl.innerText = "Save";
                taskInputEl.removeAttribute("readonly"); // Make the input editable
                taskInputEl.focus(); // Focus on the input
            } else {
                taskEditEl.innerText = "Edit";
                taskInputEl.setAttribute("readonly", "readonly"); // Make the input read-only again
                updateTask(task.id, taskInputEl.value, task.deadline); // Update the task on the server
            }
        });

        // Event listener for the delete button
        taskDeleteEl.addEventListener('click', () => {
            deleteTask(task.id, taskEl); // Delete the task
        });

        // Event listeners for drag and drop functionality
        taskEl.addEventListener('dragstart', () => {
            taskEl.classList.add('dragging'); // Add a class while dragging
        });

        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging'); // Remove the class when dragging ends
        });

        // Handle dragging over the task list
        listEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(listEl, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                listEl.appendChild(draggable); // Append to the end if no element is after
            } else {
                listEl.insertBefore(draggable, afterElement); // Insert before the closest element
            }
        });
    }

    // Function to update a task on the server
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
            console.log('Task updated:', data); // Log the updated task
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update task. Please try again.');
        });
    }

    // Function to delete a task from the server
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
            console.log('Task deleted:', data); // Log the deleted task
            listEl.removeChild(taskElement); // Remove the task element from the DOM
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete task. Please try again.');
        });
    }

    // Fetch and display all tasks from the server on page load
    fetch('http://localhost:5000/Tasks')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        data.forEach(task => {
            addTaskToDOM(task); // Add each task to the DOM
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to fetch tasks. Please refresh the page.');
    });

    // Event listener for the form submission to add a new task
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskText = input.value.trim(); // Get and trim the task text
        const taskDeadline = deadlineInput.value.trim(); // Get and trim the task deadline

        if (taskText === '') {
            alert('Task cannot be empty!'); // Alert if the task text is empty
            return;
        }

        // Send a POST request to add a new task
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
            addTaskToDOM(task); // Add the new task to the DOM
            input.value = ''; // Clear the input fields
            deadlineInput.value = '';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add task. Please try again.');
        });
    });

    // Function to determine the element after which the dragged element should be placed
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
