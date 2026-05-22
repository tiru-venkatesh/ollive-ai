import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Message from '../models/Message.js';
import { callLLM, streamLLM } from '../middleware/llmWrapper.js';

const router = express.Router();

// Standard chat
router.post('/', async (req, res) => {
  try {
    const { message, sessionId = uuidv4(), provider = 'groq' } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    await Message.create({ sessionId, role: 'user', content: message });

    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });
    const messages = history.map(m => ({ role: m.role, content: m.content }));

    const reply = await callLLM({ messages, sessionId, provider });
    await Message.create({ sessionId, role: 'assistant', content: reply });

    res.json({ reply, sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Streaming chat (SSE)
router.post('/stream', async (req, res) => {
  const { message, sessionId = uuidv4() } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  try {
    await Message.create({ sessionId, role: 'user', content: message });

    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });
    const messages = history.map(m => ({ role: m.role, content: m.content }));

    let fullResponse = '';

    for await (const delta of streamLLM({ messages, sessionId })) {
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ delta, sessionId })}\n\n`);
    }

    await Message.create({ sessionId, role: 'assistant', content: fullResponse });
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;