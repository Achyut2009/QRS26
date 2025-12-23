// /server/index.ts (updated)
import express from 'express';
import cors from 'cors';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import quizRoutes from '@/app/api/quizzes/route';
import { UserSyncService } from '@/app/api/sync-user/route';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3001;

// Get your app's URL (for development/production)
const getAppUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_URL || 'https://yourapp.com';
  }
  // For local development with Expo Go
  const localIp = require('ip').address();
  return `http://${localIp}:3001`;
};

app.use(cors({
  origin: ['http://localhost:8081', 'exp://localhost:8081', 'http://localhost:3000', 'exp://localhost:19000'],
  credentials: true,
}));
app.use(express.json());

// Middleware to sync user on every request
const syncUserMiddleware = async (req: any, res: any, next: any) => {
  try {
    const { userId } = (req as any).auth;
    
    if (userId) {
      // Fetch user from Clerk
      const clerkClient = req.auth.clerkClient;
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Sync user to database
      await UserSyncService.syncUser({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.profileImageUrl,
      });
    }
    next();
  } catch (error) {
    console.error('User sync failed:', error);
    next();
  }
};

// User info endpoint
app.get('/api/user/info', ClerkExpressWithAuth(), syncUserMiddleware, async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });
    
    res.json({ user, appUrl: getAppUrl() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Apply auth and sync middleware to all quiz routes
app.use('/api/quiz', ClerkExpressRequireAuth(), syncUserMiddleware, quizRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`App URL: ${getAppUrl()}`);
  console.log(`API Base URL: ${getAppUrl()}/api`);
});