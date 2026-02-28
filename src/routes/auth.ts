import express from 'express';
import { login, register, me, verifyMagicLink } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify', verifyMagicLink);
router.post('/register', register);
router.get('/me', authenticateToken, me);

export default router;
