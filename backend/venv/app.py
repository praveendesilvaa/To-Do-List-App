from flask import Flask, request, jsonify, render_template, send_from_directory
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb+srv://Praveen:Praveen@cluster0.my8itp8.mongodb.net/'

client = MongoClient(app.config['MONGO_URI'])
db = client.get_database('to-do')
tasks_collection = db.Tasks

@app.route('/')
def index():
    return render_template('to_do.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/Tasks', methods=['GET'])
def get_tasks():
    tasks = tasks_collection.find()
    data = [{'id': str(task['_id']),
             'text': task['text'],
             'created_at': task.get('created_at'),
             'deadline': task.get('deadline')}
            for task in tasks]
    return jsonify(data)

@app.route('/Tasks', methods=['POST'])
def add_task():
    task_data = request.json
    text = task_data.get('text', '')
    deadline = task_data.get('deadline', None)

    if text:
        new_task = {'text': text, 'created_at': datetime.utcnow()}
        if deadline:
            new_task['deadline'] = deadline

        result = tasks_collection.insert_one(new_task)
        new_task['_id'] = str(result.inserted_id)  # Add ID to the new task object
        return jsonify(new_task), 201  # Return new task with ID and 201 status code

    return jsonify({'error': 'Text is required'}), 400

@app.route('/Tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    task_data = request.json
    text = task_data.get('text', '')
    deadline = task_data.get('deadline', None)

    if text:
        task = tasks_collection.find_one({'_id': ObjectId(task_id)})
        if task:
            update_data = {'text': text}
            if deadline:
                update_data['deadline'] = deadline

            result = tasks_collection.update_one({'_id': ObjectId(task_id)}, {'$set': update_data})
            if result.modified_count:
                updated_task = tasks_collection.find_one({'_id': ObjectId(task_id)})
                return jsonify({'id': task_id, 'text': updated_task['text'], 'deadline': updated_task.get('deadline'), 'created_at': updated_task.get('created_at')})
            return jsonify({'error': 'Task not found'}), 404
        return jsonify({'error': 'Task not found'}), 404

    return jsonify({'error': 'Text is required'}), 400

@app.route('/Tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    result = tasks_collection.delete_one({'_id': ObjectId(task_id)})
    if result.deleted_count:
        return jsonify({'result': 'Task deleted'})
    return jsonify({'error': 'Task not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
