require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const socketHandlers = require('./socket/socketHandlers');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/messages'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.IO handlers
socketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('════════════════════════════════════════');
  console.log('Chat Server is running!');
  console.log('════════════════════════════════════════');
  console.log(` Port: ${PORT}`);
  console.log(` API: http://localhost:${PORT}/api`);
  console.log(` Socket.IO: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log('════════════════════════════════════════');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('════════════════════════════════════════');
    console.error(' ERROR: Port', PORT, 'is already in use!');
    console.error('════════════════════════════════════════');
    console.log('\n📋 Quick Fix Options:');
    console.log('1. Run: kill-port.bat (in project root)');
    console.log('2. Or manually kill the process:');
    console.log('   netstat -ano | findstr :5000');
    console.log('   taskkill /F /PID <PID>');
    console.log('3. Or use a different port:');
    console.log('   PORT=5001 npm run dev');
    console.log('\n════════════════════════════════════════');
    process.exit(1);
  } else {
    console.error(' Server error:', error.message);
    process.exit(1);
  }
});

