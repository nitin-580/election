import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'Admin' | 'Editor' | 'Marker' | 'Watcher';
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Access token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_election_key_123!';

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const requireRole = (roles: Array<'Admin' | 'Editor' | 'Marker' | 'Watcher'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied. Insufficient role permissions.' });
    }

    next();
  };
};
