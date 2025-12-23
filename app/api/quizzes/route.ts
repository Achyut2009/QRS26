// /server/routes/quiz.ts
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@/db';  // Changed from '@/db' to '../db'
import { quizzes, questions, attempts, users } from '@/db/schema';  // Changed from '@/db/schema'
import { eq, and, desc, sql, gt, lt } from 'drizzle-orm';

const router = express.Router();

// Extend Express Request type to include auth and user
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionId?: string;
        orgId?: string;
        orgRole?: string;
        orgSlug?: string;
        claims?: any;
      };
      user?: any;
    }
  }
}

// Middleware to attach auth to request
const attachAuth = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, this would extract auth from headers/token
  // For now, we'll handle it via middleware in the main server file
  next();
};

// Apply auth middleware to all routes
router.use(attachAuth);

// Middleware to check if user is admin
const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user by clerkUserId in your database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    // If not found by clerkUserId, try finding by id (for backward compatibility)
    if (!user) {
      const userById = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!userById || userById.email !== 'achyutkpaliwal@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      
      req.user = userById;
    } else if (!user || user.email !== 'achyutkpaliwal@gmail.com') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    } else {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all active quizzes
router.get('/active', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const activeQuizzes = await db.select()
      .from(quizzes)
      .where(
        and(
          eq(quizzes.isActive, true),
          // Handle null values by checking they exist first
          quizzes.scheduledEnd ? gt(quizzes.scheduledEnd, now) : undefined,
          quizzes.scheduledStart ? lt(quizzes.scheduledStart, now) : undefined
        )
      )
      .orderBy(desc(quizzes.createdAt));

    res.json(activeQuizzes);
  } catch (error: any) {
    console.error('Failed to fetch quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz by ID with questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const quizId = req.params.id;

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is active and not expired
    const now = new Date();
    if (quiz.scheduledEnd && quiz.scheduledEnd < now) {
      return res.status(400).json({ error: 'Quiz has expired' });
    }

    // Check if quiz has started
    if (quiz.scheduledStart && quiz.scheduledStart > now) {
      return res.status(400).json({ error: 'Quiz has not started yet' });
    }

    // Check if user has already attempted
    if (userId) {
      const existingAttempt = await db.query.attempts.findFirst({
        where: and(
          eq(attempts.quizId, quizId),
          eq(attempts.userId, userId),
          eq(attempts.isCompleted, true)
        ),
      });

      if (existingAttempt) {
        return res.status(400).json({ error: 'You have already completed this quiz' });
      }
    }

    res.json(quiz);
  } catch (error: any) {
    console.error('Failed to fetch quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Submit quiz attempt
router.post('/:id/attempt', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const quizId = req.params.id;
    const { answers } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get quiz with questions
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is still active
    const now = new Date();
    if (quiz.scheduledEnd && quiz.scheduledEnd < now) {
      return res.status(400).json({ error: 'Quiz has expired' });
    }

    // Calculate score
    let score = 0;
    quiz.questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        score += question.points || 1;
      }
    });

    const totalScore = quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    // Check if user already has an attempt
    const existingAttempt = await db.query.attempts.findFirst({
      where: and(
        eq(attempts.quizId, quizId),
        eq(attempts.userId, userId)
      ),
    });

    if (existingAttempt) {
      await db.update(attempts)
        .set({
          score,
          totalScore,
          answers,
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(eq(attempts.id, existingAttempt.id));
    } else {
      await db.insert(attempts).values({
        userId,
        quizId,
        score,
        totalScore,
        answers,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    res.json({ 
      score, 
      totalScore,
      percentage: Math.round((score / totalScore) * 100)
    });
  } catch (error: any) {
    console.error('Failed to submit attempt:', error);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

// Get rankings for a quiz
router.get('/:id/rankings', async (req: Request, res: Response) => {
  try {
    const quizId = req.params.id;

    const rankings = await db.select({
      userId: attempts.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      score: attempts.score,
      totalScore: attempts.totalScore,
      completedAt: attempts.completedAt,
    })
      .from(attempts)
      .leftJoin(users, eq(attempts.userId, users.id))
      .where(
        and(
          eq(attempts.quizId, quizId),
          eq(attempts.isCompleted, true)
        )
      )
      .orderBy(desc(attempts.score));

    res.json(rankings);
  } catch (error: any) {
    console.error('Failed to fetch rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Admin routes - create quiz
router.post('/create', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, duration, scheduledStart, scheduledEnd, questions: quizQuestions } = req.body;

    if (!req.user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Validate required fields
    if (!title || !duration || !scheduledStart || !scheduledEnd || !quizQuestions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create quiz
    const [quiz] = await db.insert(quizzes).values({
      title,
      description: description || '',
      createdBy: req.user.id,
      duration: parseInt(duration),
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      totalQuestions: quizQuestions.length,
      isActive: true,
    }).returning();

    // Create questions
    const questionPromises = quizQuestions.map((q: any) => 
      db.insert(questions).values({
        quizId: quiz.id,
        questionText: q.questionText,
        questionType: q.questionType || 'multiple_choice',
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
      })
    );

    await Promise.all(questionPromises);

    res.json(quiz);
  } catch (error: any) {
    console.error('Failed to create quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Get all user's attempts
router.get('/user/attempts', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userAttempts = await db.select({
      id: attempts.id,
      quizId: attempts.quizId,
      quizTitle: quizzes.title,
      quizDescription: quizzes.description,
      score: attempts.score,
      totalScore: attempts.totalScore,
      completedAt: attempts.completedAt,
    })
      .from(attempts)
      .leftJoin(quizzes, eq(attempts.quizId, quizzes.id))
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.completedAt));

    res.json(userAttempts);
  } catch (error: any) {
    console.error('Failed to fetch attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// User profile endpoint
router.get('/user/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      // Try finding by id for backward compatibility
      const userById = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!userById) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user: userById, isAdmin: userById.email === 'achyutkpaliwal@gmail.com' });
    } else {
      res.json({ user, isAdmin: user.email === 'achyutkpaliwal@gmail.com' });
    }
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;