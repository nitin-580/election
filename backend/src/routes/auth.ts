import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getMe);

export default router;
