import unittest
import json
from app import app, tasks_collection, client
from bson.objectid import ObjectId
from datetime import datetime, timezone

class TestToDoApp(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Initialize Flask test client
        cls.app = app.test_client()

    @classmethod
    def tearDownClass(cls):
        # Clean up after all tests
        client.close()

    def setUp(self):
        # Drop the tasks collection before each test
        tasks_collection.drop()

        # Insert some initial tasks for testing
        initial_tasks = [
            {'text': 'Task 1', 'created_at': datetime.now(timezone.utc), 'completed': False},
            {'text': 'Task 2', 'created_at': datetime.now(timezone.utc), 'completed': True}
        ]
        tasks_collection.insert_many(initial_tasks)

    def tearDown(self):
        # Clean up after each test if necessary
        pass

    def test_get_tasks(self):
        # Perform GET request to /Tasks endpoint
        response = self.app.get('/Tasks')
        data = json.loads(response.data)

        # Ensure correct status code and number of tasks returned
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 2)  # Ensure correct number of tasks returned

    def test_add_task(self):
        # Define task data for POST request
        task_data = {'text': 'New Task', 'deadline': '2024-06-30'}

        # Perform POST request to add a new task
        response = self.app.post('/Tasks', json=task_data)
        data = json.loads(response.data)

        # Ensure correct status code and 'id' in response data
        self.assertEqual(response.status_code, 201)
        self.assertIn('_id', data)

    def test_update_task(self):
        # Define task data for PUT request
        task_data = {'text': 'Updated Task', 'deadline': '2024-07-15', 'completed': True}

        # Retrieve task_id of Task 1
        task_id = str(tasks_collection.find_one({'text': 'Task 1'})['_id'])

        # Perform PUT request to update an existing task
        response = self.app.put(f'/Tasks/{task_id}', json=task_data)
        data = json.loads(response.data)

        # Ensure correct status code and updated task details in response data
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['text'], task_data['text'])
        self.assertEqual(data['deadline'], task_data['deadline'])
        self.assertEqual(data['completed'], task_data['completed'])

    def test_delete_task(self):
        # Perform DELETE request to delete an existing task
        task_id = str(tasks_collection.find_one({'text': 'Task 2'})['_id'])
        response = self.app.delete(f'/Tasks/{task_id}')

        # Ensure correct status code and success message in response data
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['result'], 'Task deleted')

if __name__ == '__main__':
    unittest.main()
