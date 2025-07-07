from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = '12345678'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat_app.db'
db = SQLAlchemy(app)
socketio = SocketIO(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(500), nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    messages = Message.query.all()
    logged_in = 'username' in session
    return render_template('index.html', messages=messages, logged_in=logged_in, username=session.get('username'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'User already exists!'})
        
        hashed_password = generate_password_hash(data['password'])
        new_user = User(username=data['username'], password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        session['username'] = new_user.username
        return jsonify({'success': True, 'message': 'Registration successful!'})
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if user and check_password_hash(user.password, data['password']):
            session['username'] = user.username
            return jsonify({'success': True, 'message': 'Login successful!'})
        return jsonify({'success': False, 'message': 'Invalid username or password!'})
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('home'))

@app.route('/chat', methods=['POST'])
def chat():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Please log in first!'})

    data = request.get_json()
    new_message = Message(username=session['username'], message=data['message'])
    db.session.add(new_message)
    db.session.commit()
    socketio.emit('new_message', {'username': session['username'], 'message': data['message']})
    return jsonify({'success': True, 'username': session['username'], 'message': data['message']})

@socketio.on('connect')
def handle_connect():
    if 'username' in session:
        emit('status', {'msg': f"{session['username']} has joined the chat"}, broadcast=True)
        
from flask import request, jsonify

AUTHORIZED_USER = {'username': 'raydonggs', 'password': 'HB34e69q6FE'}

@app.route('/clear', methods=['POST'])
def clear_chat():
    data = request.json
    if not data:
        return jsonify({'status': 'error', 'message': 'Missing data'}), 400
    if data.get('username') == AUTHORIZED_USER['username'] and data.get('password') == AUTHORIZED_USER['password']:
        clear_chat_messages()
        socketio.emit('clear_chat')  # notify clients to clear UI (see next)
        return jsonify({'status': 'success', 'message': 'Chat cleared.'})
    else:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

def clear_chat_messages():
    Message.query.delete()
    db.session.commit()

@socketio.on('disconnect')
def handle_disconnect():
    if 'username' in session:
        emit('status', {'msg': f"{session['username']} has left the chat"}, broadcast=True)

import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)

