import express from 'express';
import InferenceLog from '../models/InferenceLog.js';

const router = express.Router();

// Get all inference logs (most recent first)
router.get('/', async (req, res) => {
  try {
    const { provider, status, limit = 100 } = req.query;
    const filter = {};
    if (provider) filter.provider = provider;
    if (status) filter.status = status;

    const logs = await InferenceLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get aggregated stats (for dashboard)
router.get('/stats', async (req, res) => {
  try {
    const stats = await InferenceLog.aggregate([
      {
        $group: {
          _id: '$provider',
          totalRequests: { $sum: 1 },
          avgLatency: { $avg: '$latencyMs' },
          totalTokens: { $sum: '$totalTokens' },
          errors: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
