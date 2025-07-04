const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (like your dashboard.html)
app.use(express.static('public'));

// Basic socket connection
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO');
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
