const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const jwt = require('jsonwebtoken');

const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const socketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Update user online status
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Join user's personal room
    socket.join(userId.toString());

    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId });

    console.log(`User ${userId} connected`);

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, message } = data;

        if (!receiverId || !message) {
          return socket.emit('error', { message: 'Invalid message data' });
        }

        // Find or create conversation
        // Mongoose handles string IDs automatically
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, receiverId] },
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [userId, receiverId],
          });
          await conversation.save();
        }

        // Create message
        const newMessage = new Message({
          conversationId: conversation._id,
          senderId: userId,
          receiverId,
          message,
          isDelivered: true,
        });

        await newMessage.save();

        // Update conversation last message
        conversation.lastMessage = message;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate sender info
        await newMessage.populate('senderId', 'username');

        // Convert to plain object for Socket.IO
        const messageObj = newMessage.toObject();

        // Emit to receiver
        io.to(receiverId.toString()).emit('message:new', messageObj);

        // Emit back to sender for confirmation
        socket.emit('message:sent', messageObj);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      socket.to(receiverId.toString()).emit('typing:start', {
        senderId: userId,
      });
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      socket.to(receiverId.toString()).emit('typing:stop', {
        senderId: userId,
      });
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        const { messageId, senderId } = data;

        const message = await Message.findById(messageId);
        if (message && message.receiverId.toString() === userId.toString()) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          // Notify sender
          io.to(senderId.toString()).emit('message:read', {
            messageId,
            readAt: message.readAt,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle mark all messages as read
    socket.on('messages:read-all', async (data) => {
      try {
        const { senderId } = data;

        const conversation = await Conversation.findOne({
          participants: { $all: [userId, senderId] },
        });

        if (conversation) {
          await Message.updateMany(
            {
              conversationId: conversation._id,
              receiverId: userId,
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          );

          // Notify sender
          io.to(senderId.toString()).emit('messages:read-all', {
            receiverId: userId,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Notify others that user is offline
      socket.broadcast.emit('user:offline', { userId });

      console.log(`User ${userId} disconnected`);
    });
  });
};

module.exports = socketHandlers;

