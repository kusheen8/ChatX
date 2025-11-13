const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');
const router = express.Router();

// Get messages for a conversation
router.get('/conversations/:userId/messages', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Find or create conversation
    // Mongoose handles string IDs automatically
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, userId],
      });
      await conversation.save();
    }

    // Get messages
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

