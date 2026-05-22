import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// List all conversations
router.get('/', async (req, res) => {
  try {
    const sessions = await Message.aggregate([
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $last: '$content' },
          lastTimestamp: { $last: '$timestamp' },
          messageCount: { $sum: 1 },
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resume a conversation - get all messages
router.get('/:sessionId', async (req, res) => {
  try {
    const messages = await Message.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel / delete a conversation
router.delete('/:sessionId', async (req, res) => {
  try {
    await Message.deleteMany({ sessionId: req.params.sessionId });
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
