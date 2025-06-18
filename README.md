# Stock Trading Web Application

A modern, real-time stock trading platform that enables users to track live stock prices and manage IPO subscriptions. Built with reliability and user experience in mind.

## Technology Stack

- **Backend**: Node.js with Express framework
- **Database**: MongoDB for user data and subscriptions
- **Real-time Updates**: Socket.IO for live price feeds
- **External API**: Finnhub for stock market data
- **Frontend**: Bootstrap 5 with custom JavaScript
- **Security**: bcrypt encryption and session management

## Prerequisites

To run this application, you'll need:
- Docker and Docker Compose installed on your system
- A MongoDB database
- A Finnhub API key 

## Quick Start

### 1. Get the Code
```bash
git clone https://github.com/AksayaVenugopal/Stock-Brocker-Dashboard
cd stock-trading-app
```

### 2. Configure Environment
Create a `.env` file in your project root:

```env
# Database Configuration
MONGO_URI=your_mongodb_connection_string
DB_NAME=Stock
COLLECTION_NAME=users
# API Configuration
FINNHUB_API_KEY=your_finnhub_api_key
# Application
PORT=3000
NODE_ENV=production
```

**Important**: Replace the placeholder values with your actual credentials. Never commit real credentials to version control.

### 3. Docker Setup
Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  stock-app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 4. Application Dockerfile
Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### 5. Dependencies (package.json)
```json
{
  "name": "stock-trading-app",
  "version": "1.0.0",
  "description": "Real-time stock trading platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.0",
    "body-parser": "^1.20.2",
    "mongodb": "^5.7.0",
    "express-session": "^1.17.3",
    "socket.io": "^4.7.2"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## Running the Application

Start your trading platform with a single command:

```bash
docker-compose up --build
```

The application will be available at **http://localhost:3000**

To run in the background:
```bash
docker-compose up -d --build
```

## Project Structure

```
stock-trading-app/
├── server.js              # Main application server
├── public/
│   ├── dashboard.html     # Trading dashboard
│   ├── login.html        # User login
│   └── signup.html       # Account creation
├── package.json          # Node.js dependencies
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Multi-container setup
├── .env                # Environment variables
└── README.md           # This documentation
```
