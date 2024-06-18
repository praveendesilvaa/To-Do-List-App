// Import the functions to be tested
import { updateTask, deleteTask } from '/Users/praveendesilva/Documents/To-Do-List-App/frontend/to_do.js'; 

describe('updateTask function', () => {
    test('sends PUT request to update task', async () => {
        const mockTaskId = 1;
        const mockNewText = 'Updated Task';
        const mockNewDeadline = null;
        const mockNewCompleted = true;

        // Mock the fetch function
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => ({ id: mockTaskId, text: mockNewText, deadline: mockNewDeadline, completed: mockNewCompleted })
        });

        // Call the function
        await updateTask(mockTaskId, mockNewText, mockNewDeadline, mockNewCompleted);

        // Expectations
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://localhost:5000/Tasks/${mockTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: mockNewText, deadline: mockNewDeadline, completed: mockNewCompleted })
        });
    });
});

describe('deleteTask function', () => {
    test('sends DELETE request to delete task', async () => {
        const mockTaskId = 1;

        // Mock the fetch function
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => ({ id: mockTaskId })
        });

        // Call the function
        await deleteTask(mockTaskId);

        // Expectations
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://localhost:5000/Tasks/${mockTaskId}`, {
            method: 'DELETE'
        });
    });
});
