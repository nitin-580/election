import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import analyticsRoutes from './routes/analytics';
import userRoutes from './routes/users';
import User from './models/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*', // We can restrict this to frontend URL later if needed
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests in dev mode
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Helper endpoint to fetch users for assignment dropdowns
app.get('/api/volunteers', async (req: Request, res: Response) => {
  try {
    const volunteers = await User.find({ role: { $ne: 'Admin' } }).select('username role');
    return res.json(volunteers);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving volunteers' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  // Connect Databases
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
};

startServer();
