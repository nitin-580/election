import { Router } from 'express';
import { getUsers, createUser, toggleBlockUser } from '../controllers/userController';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Apply authentication and admin-only restriction
router.use(authenticateJWT);
router.use(requireRole(['Admin']));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/block', toggleBlockUser);

export default router;
