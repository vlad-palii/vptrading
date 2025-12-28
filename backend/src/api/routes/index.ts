import { Router } from 'express';
import marketRoutes from './market.js';
import accountRoutes from './account.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Mount route modules
router.use('/market', marketRoutes);
router.use('/account', accountRoutes);

// Placeholder routes for Phase 2+
router.use('/trading', (req, res) => {
  res.status(501).json({ error: 'Trading routes not yet implemented' });
});

router.use('/risk', (req, res) => {
  res.status(501).json({ error: 'Risk routes not yet implemented' });
});

router.use('/ai', (req, res) => {
  res.status(501).json({ error: 'AI routes not yet implemented' });
});

export default router;
