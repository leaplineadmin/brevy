import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '@shared/schema';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  language: z.enum(['en', 'fr']).optional(),
  acceptedTerms: z.boolean().optional(),
  acceptedPrivacy: z.boolean().optional(),
  termsAcceptedAt: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Get current user
router.get('/user', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  if (isAuthenticated) {
    return res.json(req.user);
  }
  return res.status(401).json({ message: "Not authenticated" });
}));

// Register
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, language, acceptedTerms, acceptedPrivacy, termsAcceptedAt } = req.body;
  const userEmail = email || username;
  
  if (!userEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, userEmail))
    .limit(1);

  if (existingUser.length > 0) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await db
    .insert(usersTable)
    .values({
      email: userEmail,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      language: language || 'en',
      acceptedTerms: acceptedTerms || false,
      acceptedPrivacy: acceptedPrivacy || false,
      termsAcceptedAt: termsAcceptedAt ? new Date(termsAcceptedAt) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  res.status(201).json({ 
    message: "User created successfully",
    user: { id: newUser[0].id, email: newUser[0].email }
  });
}));

// Login (handled by passport)
router.post('/login', validateBody(loginSchema), (req, res, next) => {
  // Passport will handle the actual authentication
  // This is just for validation
  next();
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
