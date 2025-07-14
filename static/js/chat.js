// AI Chat with Source Tracking - JavaScript

class ChatApp {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.initializeElements();
        this.initializeSocket();
        this.attachEventListeners();
    }

    initializeElements() {
        // Main chat elements
        this.chatContainer = document.getElementById('chat-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatForm = document.getElementById('chat-form');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Status elements
        this.apiStatus = document.getElementById('api-status');
        this.connectionStatus = document.getElementById('connection-status');
        this.lastCheck = document.getElementById('last-check');
        this.refreshButton = document.getElementById('refresh-status');
    }

    initializeSocket() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
            });

            this.socket.on('api_status_update', (data) => {
                this.updateAPIStatus(data);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.updateConnectionStatus('disconnected', 'Connection Error');
            });
        } catch (error) {
            console.error('Socket initialization failed:', error);
            this.updateConnectionStatus('disconnected', 'Socket Error');
            // Fallback to regular HTTP for API status
            this.loadInitialAPIStatus();
        }
    }

    attachEventListeners() {
        // Chat form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Enter key for sending messages
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Refresh API status
        this.refreshButton.addEventListener('click', () => {
            this.refreshAPIStatus();
        });

        // Auto-focus on message input
        this.messageInput.focus();
    }

    updateConnectionStatus(status, text) {
        this.connectionStatus.className = `connection-indicator ${status}`;
        this.connectionStatus.textContent = text;
    }

    updateAPIStatus(data) {
        const statusDot = this.apiStatus.querySelector('.status-dot');
        const statusText = this.apiStatus.querySelector('.status-text');
        
        // Update status dot
        statusDot.className = 'status-dot';
        if (data.status === 'online') {
            statusDot.classList.add('online');
            statusText.textContent = '🟢 API Online';
        } else if (data.status === 'offline') {
            statusDot.classList.add('offline');
            statusText.textContent = '🔴 API Offline';
        } else if (data.status === 'limited') {
            statusDot.classList.add('limited');
            statusText.textContent = '⚠️ API Limited';
        }

        // Update last check time
        const timestamp = new Date(data.timestamp);
        this.lastCheck.textContent = `Last check: ${timestamp.toLocaleTimeString()}`;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Disable input while processing
        this.setInputEnabled(false);
        this.showLoading(true);

        // Add user message to chat
        this.addMessage(message, 'user');

        // Clear input
        this.messageInput.value = '';

        try {
            // Send message to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add bot response to chat
            this.addMessage(data.message, 'bot', {
                source: data.source,
                confidence: data.confidence,
                timestamp: data.timestamp
            });

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Add error message
            this.addMessage(
                'Sorry, I encountered an error while processing your message. Please try again.',
                'bot',
                {
                    source: 'emergency',
                    confidence: 0,
                    timestamp: new Date().toISOString()
                }
            );
        } finally {
            this.setInputEnabled(true);
            this.showLoading(false);
            this.messageInput.focus();
        }
    }

    addMessage(content, type, metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                </div>
            `;
        } else {
            // Bot message with source badge and confidence
            const sourceBadge = this.getSourceBadge(metadata.source);
            const confidenceDisplay = metadata.confidence ? 
                `<span class="confidence-score">${metadata.confidence}%</span>` : '';

            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        ${sourceBadge}
                        ${confidenceDisplay}
                    </div>
                    <p>${this.escapeHtml(content)}</p>
                </div>
            `;
        }

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    getSourceBadge(source) {
        const badges = {
            'gemini': '🟢 Gemini API',
            'knowledge_base': '🟡 Knowledge Base',
            'smart_fallback': '🟠 Smart Fallback',
            'emergency': '🔴 Emergency'
        };

        const text = badges[source] || '❓ Unknown';
        const className = source || 'unknown';

        return `<span class="source-badge ${className}">${text}</span>`;
    }

    refreshAPIStatus() {
        if (this.isConnected && this.socket) {
            this.socket.emit('ping_api');
            
            // Show loading state
            const statusDot = this.apiStatus.querySelector('.status-dot');
            statusDot.className = 'status-dot loading';
            this.apiStatus.querySelector('.status-text').textContent = 'Checking...';
        } else {
            // Fallback to HTTP request
            this.loadInitialAPIStatus();
        }
    }

    async loadInitialAPIStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            this.updateAPIStatus({
                status: data.gemini_online ? 'online' : 'offline',
                text: data.status_text,
                timestamp: data.last_check
            });
        } catch (error) {
            console.error('Failed to load API status:', error);
            this.updateAPIStatus({
                status: 'offline',
                text: 'Status Unknown',
                timestamp: new Date().toISOString()
            });
        }
    }

    setInputEnabled(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Utility functions for demo purposes
function simulateTyping(element, text, speed = 50) {
    return new Promise((resolve) => {
        let index = 0;
        element.textContent = '';
        
        function typeChar() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeChar, speed);
            } else {
                resolve();
            }
        }
        
        typeChar();
    });
}

// Add some demo functionality
function addDemoMessages() {
    const chatApp = window.chatApp;
    
    // Add a demo conversation after a short delay
    setTimeout(() => {
        chatApp.addMessage("Hello! Can you help me understand how this system works?", "user");
        
        setTimeout(() => {
            chatApp.addMessage(
                "Of course! This chat system uses multiple sources to provide responses. You can see the source of each response in the colored badges. I'm currently responding from our knowledge base.",
                "bot",
                {
                    source: 'knowledge_base',
                    confidence: 92
                }
            );
        }, 1000);
    }, 2000);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
    
    // Load initial API status
    setTimeout(() => {
        window.chatApp.loadInitialAPIStatus();
    }, 1000);
    
    // Add demo messages for better user experience
    if (window.location.search.includes('demo=true')) {
        addDemoMessages();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatApp;
}