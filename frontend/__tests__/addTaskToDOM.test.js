// Import the function to be tested
import { addTaskToDOM } from '/Users/praveendesilva/Documents/To-Do-List-App/frontend/to_do.js'; 

// Mock the necessary DOM elements
document.body.innerHTML = `
    <div id="tasks"></div>
`;

describe('addTaskToDOM function', () => {
    test('adds task element to the DOM', () => {
        const mockTask = {
            id: 1,
            text: 'Sample Task',
            deadline: null,
            created_at: '2024-06-18T12:00:00',
            completed: false
        };

        // Call the function
        addTaskToDOM(mockTask);

        // Expectations
        const taskElement = document.querySelector('.task');
        expect(taskElement).toBeTruthy();
        expect(taskElement.querySelector('.text').value).toBe('Sample Task');
        expect(taskElement.querySelector('.date').textContent).toContain('Created:');
    });
});
