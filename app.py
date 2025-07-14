"""
AI Chat Application with Source Tracking and API Status
Supports multiple response sources: Gemini API, Knowledge Base, Smart Fallback, Emergency
"""

import json
import random
import time
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import requests
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global API status tracking
api_status = {
    'gemini': True,  # True = online, False = offline
    'last_check': datetime.now(),
    'status_text': 'API Online'
}

# Knowledge base for fallback responses
knowledge_base = {
    'greeting': "Hello! I'm here to help you with any questions you might have.",
    'help': "I can assist you with various topics. Feel free to ask me anything!",
    'default': "I understand you're asking about that topic. Let me provide some general information."
}

def get_gemini_response(message):
    """Simulate Gemini API call with potential failures"""
    global api_status
    
    # Simulate API availability (70% success rate for demo)
    if random.random() < 0.7:
        # Simulate successful API response
        api_status['gemini'] = True
        api_status['status_text'] = 'API Online'
        api_status['last_check'] = datetime.now()
        
        # Emit status update
        socketio.emit('api_status_update', {
            'status': 'online',
            'text': 'API Online',
            'timestamp': api_status['last_check'].isoformat()
        })
        
        return {
            'response': f"Gemini AI response to: {message}",
            'source': 'gemini',
            'confidence': random.randint(85, 98)
        }
    else:
        # Simulate API failure
        api_status['gemini'] = False
        api_status['status_text'] = 'API Offline'
        api_status['last_check'] = datetime.now()
        
        # Emit status update
        socketio.emit('api_status_update', {
            'status': 'offline',
            'text': 'API Offline',
            'timestamp': api_status['last_check'].isoformat()
        })
        
        return None

def get_knowledge_base_response(message):
    """Get response from local knowledge base"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return {
            'response': knowledge_base['greeting'],
            'source': 'knowledge_base',
            'confidence': random.randint(75, 90)
        }
    elif any(word in message_lower for word in ['help', 'assist']):
        return {
            'response': knowledge_base['help'],
            'source': 'knowledge_base',
            'confidence': random.randint(70, 85)
        }
    else:
        return {
            'response': knowledge_base['default'],
            'source': 'knowledge_base',
            'confidence': random.randint(60, 80)
        }

def get_smart_fallback_response(message):
    """Generate contextual fallback response"""
    return {
        'response': f"I understand you're asking about '{message}'. While I can't access my primary systems right now, I can provide some general assistance.",
        'source': 'smart_fallback',
        'confidence': random.randint(50, 70)
    }

def get_emergency_response():
    """Last resort emergency response"""
    return {
        'response': "I'm experiencing technical difficulties. Please try again later or contact support.",
        'source': 'emergency',
        'confidence': 20
    }

def get_chat_response(message):
    """Main function to get chat response with fallback chain"""
    
    # Try Gemini API first
    response = get_gemini_response(message)
    if response:
        return response
    
    # Fallback to knowledge base
    try:
        response = get_knowledge_base_response(message)
        if response:
            return response
    except:
        pass
    
    # Smart fallback
    try:
        response = get_smart_fallback_response(message)
        if response:
            return response
    except:
        pass
    
    # Emergency fallback
    return get_emergency_response()

@app.route('/')
def index():
    """Serve the chat interface"""
    return render_template('chat.html')

@app.route('/api/status')
def get_api_status():
    """Get current API status"""
    return jsonify({
        'gemini_online': api_status['gemini'],
        'status_text': api_status['status_text'],
        'last_check': api_status['last_check'].isoformat()
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    data = request.get_json()
    message = data.get('message', '')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Get response from the appropriate source
    response_data = get_chat_response(message)
    
    return jsonify({
        'message': response_data['response'],
        'source': response_data['source'],
        'confidence': response_data.get('confidence'),
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    emit('api_status_update', {
        'status': 'online' if api_status['gemini'] else 'offline',
        'text': api_status['status_text'],
        'timestamp': api_status['last_check'].isoformat()
    })

@socketio.on('ping_api')
def handle_ping():
    """Manual API status check"""
    # Simulate checking API status
    api_status['last_check'] = datetime.now()
    
    # Random status for demo
    if random.random() < 0.8:
        api_status['gemini'] = True
        api_status['status_text'] = 'API Online'
        status = 'online'
    else:
        api_status['gemini'] = False
        api_status['status_text'] = 'API Offline'
        status = 'offline'
    
    emit('api_status_update', {
        'status': status,
        'text': api_status['status_text'],
        'timestamp': api_status['last_check'].isoformat()
    }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)