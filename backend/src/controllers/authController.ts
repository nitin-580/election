import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAction } from '../utils/auditLogger';
import {
  getFailedAttempts,
  incrementFailedAttempts,
  resetFailedAttempts,
  getLockExpiry,
} from '../utils/rateLimitHelper';

export const login = async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if account is currently locked
    const lockExpiry = await getLockExpiry(username);
    if (lockExpiry) {
      const remainingMinutes = Math.ceil((lockExpiry - Date.now()) / 1000 / 60);
      return res.status(429).json({
        message: `Account is temporarily locked due to repeated login failures. Please try again in ${remainingMinutes} minutes.`,
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      const { attempts, locked } = await incrementFailedAttempts(username);
      return res.status(401).json({
        message: locked
          ? 'Too many failed attempts. Your account has been temporarily locked for 15 minutes.'
          : `Invalid credentials. Failed attempts: ${attempts}/5`,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const { attempts, locked } = await incrementFailedAttempts(username);
      return res.status(401).json({
        message: locked
          ? 'Too many failed attempts. Your account has been temporarily locked for 15 minutes.'
          : `Invalid credentials. Failed attempts: ${attempts}/5`,
      });
    }

    // Success! Reset failures.
    await resetFailedAttempts(username);

    // Create JWT token
    const secret = process.env.JWT_SECRET || 'super_secret_election_key_123!';
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secret,
      { expiresIn: '8h' }
    );

    await logAction(user._id.toString(), 'USER_LOGIN', { username: user.username, role: user.role });

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await logAction(req.user.id, 'USER_LOGOUT', { username: req.user.username });
    }
    return res.json({ message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
