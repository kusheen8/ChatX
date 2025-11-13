const express = require('express');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all users except current user
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email isOnline lastSeen')
      .sort({ username: 1 });

    // Get last messages for each user
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [req.user._id, user._id] },
        }).sort({ lastMessageAt: -1 });

        let lastMessage = null;
        if (conversation) {
          const message = await Message.findOne({
            conversationId: conversation._id,
          })
            .sort({ createdAt: -1 })
            .populate('senderId', 'username')
            .lean();

          if (message && message.senderId) {
            lastMessage = {
              message: message.message,
              senderId: message.senderId._id?.toString() || message.senderId.toString(),
              createdAt: message.createdAt,
            };
          }
        }

        return {
          id: user._id,
          username: user.username,
          email: user.email,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          lastMessage: lastMessage?.message || null,
          lastMessageSenderId: lastMessage?.senderId || null,
          lastMessageTime: lastMessage?.createdAt || null,
        };
      })
    );

    res.json(usersWithLastMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

