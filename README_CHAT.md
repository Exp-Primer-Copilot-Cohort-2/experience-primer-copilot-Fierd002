# AI Chat Interface with Source Tracking

A modern chat interface that shows users the source of each AI response and real-time API status.

## Features

### 🎯 Source Badges
Each bot response displays a colored badge showing the response source:
- 🟢 **Gemini API** (green) - Primary AI responses from Gemini 1.5 Flash
- 🟡 **Knowledge Base** (yellow) - Responses from local knowledge base
- 🟠 **Smart Fallback** (orange) - Contextual fallback responses
- 🔴 **Emergency** (red) - System failure mode responses

### 📊 API Status Indicator
Real-time API status display in the sidebar:
- 🟢 **API Online** - Gemini API is working normally
- 🔴 **API Offline** - Gemini API is down/failing
- ⚠️ **API Limited** - API has issues but partially working

### 🎯 Response Confidence Scores
Each response includes a confidence percentage (0-100%) when available.

### 📱 Responsive Design
- Desktop: Sidebar + main chat area layout
- Mobile: Stacked layout with chat prioritized at top

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open http://localhost:5000 in your browser

## Architecture

### Backend (app.py)
- Flask application with WebSocket support
- Fallback chain: Gemini API → Knowledge Base → Smart Fallback → Emergency
- Real-time API status monitoring
- Confidence score calculation

### Frontend (templates/chat.html)
- Modern chat interface with source tracking
- Real-time status updates via WebSocket
- Mobile-responsive design

### Styling (static/css/style.css)
- Clean, professional UI design
- Color-coded source badges
- Responsive layout for all screen sizes

## API Endpoints

- `GET /` - Chat interface
- `POST /api/chat` - Send message and get response
- `GET /api/status` - Get current API status
- WebSocket events for real-time updates

## Response Sources

The system uses a fallback chain to ensure responses are always available:

1. **Gemini API**: Primary AI model for best responses
2. **Knowledge Base**: Local knowledge for common queries
3. **Smart Fallback**: Contextual responses when systems fail
4. **Emergency**: Last resort error handling

Each response includes source identification and confidence scoring for transparency.