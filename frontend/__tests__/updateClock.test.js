// Import the function to be tested
import { updateClock } from '/Users/praveendesilva/Documents/To-Do-List-App/frontend/to_do.js';  

// Mock the necessary DOM elements
document.body.innerHTML = `
    <div id="clock">
        <div class="time"></div>
        <div class="date"></div>
    </div>
`;

describe('updateClock function', () => {
    test('updates the clock correctly', () => {
        // Mock the current date
        const mockDate = new Date('2024-06-18T12:34:56');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

        // Call the function
        updateClock();

        // Expectations
        expect(document.querySelector('.time').textContent).toBe('12:34:56');
        expect(document.querySelector('.date').textContent).toBe('Sat Jun 18 2024');
    });
});
