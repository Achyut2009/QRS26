// /lib/services/userSync.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type ClerkUser = {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string;
};

export class UserSyncService {
  static async syncUser(clerkUser: ClerkUser) {
    try {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) {
        throw new Error('User email not found');
      }

      // Check if user already exists by Clerk ID
      let existingUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUser.id),
      });

      // If not found by Clerk ID, check by email
      if (!existingUser) {
        existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
      }

      const userData = {
        email,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImageUrl: clerkUser.profileImageUrl,
        clerkUserId: clerkUser.id,
        isAdmin: email === 'achyutkpaliwal@gmail.com',
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existingUser) {
        // Update existing user
        await db.update(users)
          .set(userData)
          .where(eq(users.id, existingUser.id));
        return { ...existingUser, ...userData };
      } else {
        // Create new user
        const [newUser] = await db.insert(users).values({
          id: clerkUser.id, // Use Clerk user ID as primary key
          ...userData,
        }).returning();
        return newUser;
      }
    } catch (error) {
      console.error('Failed to sync user:', error);
      throw error;
    }
  }

  static async getUserByClerkId(clerkUserId: string) {
    return await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });
  }
}