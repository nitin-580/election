import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAction } from '../utils/auditLogger';

// GET /api/users - list all users (Admin only)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving users' });
  }
};

// POST /api/users - create new user (Admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required.' });
  }

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      password: hashedPassword,
      role,
    });

    await user.save();

    if (req.user) {
      await logAction(req.user.id, 'CREATE_USER', {
        createdUsername: user.username,
        role: user.role,
      });
    }

    return res.status(201).json({
      id: user._id,
      username: user.username,
      role: user.role,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating user account' });
  }
};

// PATCH /api/users/:id/block - toggle block/unblock (Admin only)
export const toggleBlockUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent blocking oneself
    if (req.user && req.user.id === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block your own administrator account' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    if (req.user) {
      await logAction(req.user.id, user.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER', {
        targetUsername: user.username,
      });
    }

    return res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error toggling user block state' });
  }
};
