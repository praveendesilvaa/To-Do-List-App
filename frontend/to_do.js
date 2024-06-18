// Wait for the DOM content to be fully loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Select important elements from the DOM
    const form = document.querySelector("#task-form"); // Form for adding new tasks
    const input = document.querySelector("#new_task"); // Input field for task description
    const deadlineInput = document.querySelector("#task_deadline"); // Input field for task deadline
    const listEl = document.querySelector("#tasks"); // Container for displaying tasks
    const clockEl = document.querySelector("#clock"); // Container for displaying clock

    // Function to update the clock displayed in the UI
    function updateClock() {
        const now = new Date(); // Get the current date and time
        const hours = now.getHours().toString().padStart(2, '0'); // Get hours (formatted to two digits)
        const minutes = now.getMinutes().toString().padStart(2, '0'); // Get minutes (formatted to two digits)
        const seconds = now.getSeconds().toString().padStart(2, '0'); // Get seconds (formatted to two digits)
        const currentDate = now.toDateString(); // Get the current date in a readable format

        // Update the clock element in the HTML
        clockEl.innerHTML = `
            <div class="time">${hours}:${minutes}:${seconds}</div>
            <div class="date">${currentDate}</div>
        `;
    }

    // Update the clock immediately upon DOM content loaded
    updateClock();

    // Update the clock every second using setInterval
    setInterval(updateClock, 1000);

    // Function to add a task element to the DOM
    function addTaskToDOM(task) {
        const taskEl = document.createElement('div'); // Create a new task container element
        taskEl.classList.add('task'); // Add 'task' class to the task container element
        taskEl.draggable = true; // Allow the task element to be draggable

        const taskContentEl = document.createElement('div'); // Create a div for task content
        taskContentEl.classList.add('content'); // Add 'content' class to task content element

        taskEl.appendChild(taskContentEl); // Append content div to task element

        // Create checkbox for task completion status
        const taskCompletedEl = document.createElement('input');
        taskCompletedEl.classList.add('completed-checkbox'); // Add class for styling
        taskCompletedEl.type = 'checkbox'; // Set input type to checkbox
        taskCompletedEl.checked = task.completed; // Set initial checkbox state based on task.completed

        taskContentEl.appendChild(taskCompletedEl); // Append checkbox to task content div

        // Create input field for task text (readonly unless editing)
        const taskInputEl = document.createElement('input');
        taskInputEl.classList.add('text'); // Add class for styling
        taskInputEl.type = 'text'; // Set input type to text
        taskInputEl.value = task.text; // Set initial value to task text
        taskInputEl.setAttribute('readonly', 'readonly'); // Make input field readonly by default

        // Check if task has passed its deadline and add class if true
        const deadlinePassed = task.deadline && new Date(task.deadline) < new Date();
        if (deadlinePassed) {
            taskInputEl.classList.add('deadline-passed'); // Add class for styling
        }

        taskContentEl.appendChild(taskInputEl); // Append input field to task content div

        // Create div to display task creation date and optional deadline
        const taskDateEl = document.createElement('div');
        taskDateEl.classList.add('date'); // Add class for styling
        taskDateEl.innerText = `Created: ${new Date(task.created_at).toLocaleDateString()}${task.deadline ? ` | Deadline: ${new Date(task.deadline).toLocaleDateString()}` : ''}`;

        taskContentEl.appendChild(taskDateEl); // Append date div to task content div

        // Create div for task actions (edit, complete, delete)
        const taskActionsEl = document.createElement('div');
        taskActionsEl.classList.add('actions'); // Add class for styling

        // Create edit button
        const taskEditEl = document.createElement('button');
        taskEditEl.classList.add('edit'); // Add class for styling
        taskEditEl.innerText = 'Edit'; // Set button text

        // Create complete button
        const taskCompleteEl = document.createElement('button');
        taskCompleteEl.classList.add('complete'); // Add class for styling
        taskCompleteEl.innerText = '✓'; // Set button text (checkmark symbol)

        // Create delete button
        const taskDeleteEl = document.createElement('button');
        taskDeleteEl.classList.add('delete'); // Add class for styling
        taskDeleteEl.innerHTML = '&times;'; // Set button text (times symbol)

        // Append edit, complete, and delete buttons to actions div
        taskActionsEl.appendChild(taskEditEl);
        taskActionsEl.appendChild(taskCompleteEl);
        taskActionsEl.appendChild(taskDeleteEl);

        taskEl.appendChild(taskActionsEl); // Append actions div to task element

        listEl.appendChild(taskEl); // Append completed task element to tasks container

        // Event listener for the edit button
        taskEditEl.addEventListener('click', () => {
            if (taskEditEl.innerText.toLowerCase() === "edit") {
                taskEditEl.innerText = "Save"; // Change button text to 'Save'
                taskInputEl.removeAttribute("readonly"); // Allow editing of task text
                taskInputEl.focus(); // Set focus on task text input field
            } else {
                const newText = taskInputEl.value.trim(); // Get edited task text
                const newDeadline = task.deadline; // Retain original deadline
                const newCompleted = taskCompletedEl.checked; // Retain completed status

                // Validate edited text
                if (newText === '') {
                    alert('Task cannot be empty!'); // Alert if edited text is empty
                    return;
                }

                taskEditEl.innerText = "Edit"; // Change button text back to 'Edit'
                taskInputEl.setAttribute("readonly", "readonly"); // Set task text input field back to readonly
                updateTask(task.id, newText, newDeadline, newCompleted); // Call updateTask function
            }
        });

        // Event listener for the mark as completed button
        taskCompleteEl.addEventListener('click', () => {
            taskCompletedEl.checked = true; // Set checkbox to checked
            updateTask(task.id, task.text, task.deadline, true); // Call updateTask function
            taskInputEl.classList.add('completed'); // Add 'completed' class for styling
            taskEl.classList.add('completed'); // Add 'completed' class for styling
        });

        // Event listener for the delete button
        taskDeleteEl.addEventListener('click', () => {
            deleteTask(task.id, taskEl); // Call deleteTask function
        });

        // Initialize task completion style if task is already completed
        if (task.completed) {
            taskInputEl.classList.add('completed'); // Add 'completed' class for styling
            taskEl.classList.add('completed'); // Add 'completed' class for styling
        }

        // Event listeners for drag and drop functionality
        taskEl.addEventListener('dragstart', () => {
            taskEl.classList.add('dragging'); // Add 'dragging' class for styling during drag
        });

        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging'); // Remove 'dragging' class after drag ends
        });

        listEl.addEventListener('dragover', (e) => {
            e.preventDefault(); // Prevent default dragover behavior
            const afterElement = getDragAfterElement(listEl, e.clientY); // Get element after which to drop
            const draggable = document.querySelector('.dragging'); // Get dragging task element
            if (afterElement == null) {
                listEl.appendChild(draggable); // Append task at end if no valid drop position
            } else {
                listEl.insertBefore(draggable, afterElement); // Insert task before valid drop position
            }
        });
    }

    // Function to update task details via API PUT request
    function updateTask(taskId, newText, newDeadline, newCompleted) {
        fetch(`http://localhost:5000/Tasks/${taskId}`, {
            method: 'PUT', // HTTP method for updating data
            headers: {
                'Content-Type': 'application/json', // Specify content type as JSON
            },
            body: JSON.stringify({ text: newText, deadline: newDeadline, completed: newCompleted }), // Convert data to JSON string
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok'); // Handle non-successful response
            }
            return response.json(); // Parse response body as JSON
        })
        .then(data => {
            console.log('Task updated:', data); // Log updated task data to console
        })
        .catch(error => {
            console.error('Error updating task:', error); // Log error message to console
            alert('Failed to update task. Please try again.'); // Alert user of update failure
        });
    }

    // Function to delete task via API DELETE request
    function deleteTask(taskId, taskElement) {
        fetch(`http://localhost:5000/Tasks/${taskId}`, {
            method: 'DELETE', // HTTP method for deleting data
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok'); // Handle non-successful response
            }
            return response.json(); // Parse response body as JSON
        })
        .then(data => {
            console.log('Task deleted:', data); //
            console.log('Task deleted:', data); // Log deleted task data to console
            listEl.removeChild(taskElement); // Remove task element from DOM
        })
        .catch(error => {
            console.error('Error deleting task:', error); // Log error message to console
            alert('Failed to delete task. Please try again.'); // Alert user of deletion failure
        });
    }

    // Fetch existing tasks from the server upon page load
    fetch('http://localhost:5000/Tasks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok'); // Handle non-successful response
            }
            return response.json(); // Parse response body as JSON
        })
        .then(data => {
            data.forEach(task => {
                addTaskToDOM(task); // Add each fetched task to the DOM
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error); // Log error message to console
            alert('Failed to fetch tasks. Please refresh the page.'); // Alert user of fetch failure
        });

    // Event listener for form submission (adding a new task)
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        const taskText = input.value.trim(); // Get trimmed task description
        const taskDeadline = deadlineInput.value.trim(); // Get trimmed task deadline

        if (taskText === '') {
            alert('Task cannot be empty!'); // Alert if task description is empty
            return;
        }

        // Send POST request to add new task to the server
        fetch('http://localhost:5000/Tasks', {
            method: 'POST', // HTTP method for adding data
            headers: {
                'Content-Type': 'application/json', // Specify content type as JSON
            },
            body: JSON.stringify({ text: taskText, deadline: taskDeadline }), // Convert data to JSON string
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok'); // Handle non-successful response
            }
            return response.json(); // Parse response body as JSON
        })
        .then(task => {
            addTaskToDOM(task); // Add newly created task to the DOM
            input.value = ''; // Clear input field for task description
            deadlineInput.value = ''; // Clear input field for task deadline
        })
        .catch(error => {
            console.error('Error adding task:', error); // Log error message to console
            alert('Failed to add task. Please try again.'); // Alert user of addition failure
        });
    });

    // Function to determine the element after which to drop a dragged item
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

