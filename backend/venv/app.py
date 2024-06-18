from flask import Flask, request, jsonify, render_template, send_from_directory
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable Cross-Origin Resource Sharing (CORS) for all routes

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb+srv://Praveen:Praveen@cluster0.my8itp8.mongodb.net/'

# Initialize MongoDB client and get the database and collection
client = MongoClient(app.config['MONGO_URI'])
db = client.get_database('to-do')
tasks_collection = db.Tasks

@app.route('/')
def index():
    # Render the main HTML page
    return render_template('to_do.html')

@app.route('/<path:filename>')
def static_files(filename):
    # Serve static files
    return send_from_directory(app.static_folder, filename)

@app.route('/Tasks', methods=['GET'])
def get_tasks():
    # Fetch all tasks from the MongoDB collection
    tasks = tasks_collection.find()
    # Create a list of tasks with relevant fields
    data = [{'id': str(task['_id']),
             'text': task['text'],
             'created_at': task.get('created_at'),
             'deadline': task.get('deadline')}
            for task in tasks]
    # Return the list of tasks as a JSON response
    return jsonify(data)

@app.route('/Tasks', methods=['POST'])
def add_task():
    # Get the task data from the request body
    task_data = request.json
    text = task_data.get('text', '')
    deadline = task_data.get('deadline', None)

    if text:
        # Create a new task with the provided text and current datetime
        new_task = {'text': text, 'created_at': datetime.utcnow()}
        if deadline:
            new_task['deadline'] = deadline

        # Insert the new task into the MongoDB collection
        result = tasks_collection.insert_one(new_task)
        new_task['_id'] = str(result.inserted_id)  # Add ID to the new task object
        # Return the new task with ID and a 201 status code
        return jsonify(new_task), 201

    # Return an error if the text field is missing
    return jsonify({'error': 'Text is required'}), 400

@app.route('/Tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    # Get the task data from the request body
    task_data = request.json
    text = task_data.get('text', '')
    deadline = task_data.get('deadline', None)

    if text:
        # Find the task by its ID
        task = tasks_collection.find_one({'_id': ObjectId(task_id)})
        if task:
            # Prepare the update data
            update_data = {'text': text}
            if deadline:
                update_data['deadline'] = deadline

            # Update the task in the MongoDB collection
            result = tasks_collection.update_one({'_id': ObjectId(task_id)}, {'$set': update_data})
            if result.modified_count:
                # Retrieve and return the updated task
                updated_task = tasks_collection.find_one({'_id': ObjectId(task_id)})
                return jsonify({'id': task_id, 'text': updated_task['text'], 'deadline': updated_task.get('deadline'), 'created_at': updated_task.get('created_at')})
            return jsonify({'error': 'Task not found'}), 404
        return jsonify({'error': 'Task not found'}), 404

    # Return an error if the text field is missing
    return jsonify({'error': 'Text is required'}), 400

@app.route('/Tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    # Delete the task by its ID
    result = tasks_collection.delete_one({'_id': ObjectId(task_id)})
    if result.deleted_count:
        # Return success message if the task was deleted
        return jsonify({'result': 'Task deleted'})
    # Return an error if the task was not found
    return jsonify({'error': 'Task not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)  # Run the Flask app in debug mode
