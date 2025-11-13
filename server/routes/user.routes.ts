import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users as usersTable, cvs as cvsTable } from '@shared/schema';
import { storage } from '../storage';

const router = Router();

// Migration route to add GDPR columns
router.get('/migrate-gdpr', asyncHandler(async (req, res) => {
  try {
    console.log('🔧 Adding GDPR columns to users table...');
    
    // Check and add accepted_terms column
    const checkAcceptedTerms = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'accepted_terms'
    `);
    
    if (checkAcceptedTerms.rows.length === 0) {
      console.log('➕ Adding accepted_terms column...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN accepted_terms BOOLEAN DEFAULT false
      `);
      console.log('✅ Column accepted_terms added successfully');
    } else {
      console.log('✅ Column accepted_terms already exists');
    }

    // Check and add accepted_privacy column
    const checkAcceptedPrivacy = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'accepted_privacy'
    `);
    
    if (checkAcceptedPrivacy.rows.length === 0) {
      console.log('➕ Adding accepted_privacy column...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN accepted_privacy BOOLEAN DEFAULT false
      `);
      console.log('✅ Column accepted_privacy added successfully');
    } else {
      console.log('✅ Column accepted_privacy already exists');
    }

    // Check and add terms_accepted_at column
    const checkTermsAcceptedAt = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'terms_accepted_at'
    `);
    
    if (checkTermsAcceptedAt.rows.length === 0) {
      console.log('➕ Adding terms_accepted_at column...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted_at TIMESTAMP
      `);
      console.log('✅ Column terms_accepted_at added successfully');
    } else {
      console.log('✅ Column terms_accepted_at already exists');
    }
    
    console.log('🎉 GDPR migration completed successfully!');
    return res.json({
      success: true,
      message: 'GDPR columns added successfully',
      columns: {
        accepted_terms: checkAcceptedTerms.rows.length > 0,
        accepted_privacy: checkAcceptedPrivacy.rows.length > 0,
        terms_accepted_at: checkTermsAcceptedAt.rows.length > 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error running GDPR migration:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Admin route to delete account by email (temporary, for support)
// Usage: POST /api/user/admin/delete-account-by-email
// Body: { "email": "user@example.com", "secret": "your-secret" }
router.post('/admin/delete-account-by-email', asyncHandler(async (req, res) => {
  const { email, secret } = req.body;
  
  // Simple security check - you should use a proper secret from env
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'temporary-secret-change-me';
  
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user by email
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user[0].id;

    // Get all user CVs
    const userCvs = await storage.getCVsByUserId(userId);

    // Delete all CVs
    for (const cv of userCvs) {
      await storage.deleteCV(cv.id);
    }

    // Delete user account
    await storage.deleteUser(userId);

    res.json({ 
      message: "Account deleted successfully",
      email: email,
      deletedCvs: userCvs.length
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
}));

// Simple URL route to delete account by email (GET request for easy access)
// Usage: GET /api/user/delete-account/ncharron.lelbo@gmail.com?secret=your-secret
// Note: Email should be URL encoded (use encodeURIComponent)
router.get('/delete-account/:email', asyncHandler(async (req, res) => {
  const emailParam = req.params.email;
  const email = decodeURIComponent(emailParam);
  const { secret } = req.query;
  
  // Simple security check
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'temporary-secret-change-me';
  
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ message: "Unauthorized. Please provide a valid secret." });
  }
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user by email
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user[0].id;

    // Get all user CVs
    const userCvs = await storage.getCVsByUserId(userId);

    // Delete all CVs
    for (const cv of userCvs) {
      await storage.deleteCV(cv.id);
    }

    // Delete user account
    await storage.deleteUser(userId);

    res.json({ 
      success: true,
      message: "Account deleted successfully",
      email: email,
      deletedCvs: userCvs.length
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
}));

// Delete account schema
const deleteAccountSchema = z.object({
  password: z.string().min(1)
});

// Export user data
router.get('/export-data', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Get user data
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all CVs
    const userCvs = await storage.getCVsByUserId(userId);

    // Get cookie consent data from localStorage (we'll return instructions for client-side)
    const cookieConsent = {
      note: "Cookie consent preferences are stored in browser localStorage. Please check your browser's localStorage for 'cookie-consent' key."
    };

    // Compile all data
    const exportData = {
      user: {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        language: user[0].language,
        acceptedTerms: user[0].acceptedTerms,
        acceptedPrivacy: user[0].acceptedPrivacy,
        termsAcceptedAt: user[0].termsAcceptedAt,
        createdAt: user[0].createdAt,
        updatedAt: user[0].updatedAt,
        hasActiveSubscription: user[0].hasActiveSubscription,
      },
      cvs: userCvs.map(cv => ({
        id: cv.id,
        title: cv.title,
        templateId: cv.templateId,
        templateType: cv.templateType,
        mainColor: cv.mainColor,
        cvData: cv.cvData,
        isPublished: cv.isPublished,
        subdomain: cv.subdomain,
        publishedAt: cv.publishedAt,
        publishedLanguage: cv.publishedLanguage,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      })),
      cookieConsent,
      exportDate: new Date().toISOString(),
    };

    res.json(exportData);
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ message: "Failed to export data", error: error.message });
  }
}));

// Delete user account
router.post('/delete-account', requireAuth, validateBody(deleteAccountSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { password } = req.body;

  try {
    // Get user
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password (only if user has a password, not for OAuth users)
    if (user[0].password) {
      const isPasswordValid = await bcrypt.compare(password, user[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    // Get all user CVs
    const userCvs = await storage.getCVsByUserId(userId);

    // Delete all CVs
    for (const cv of userCvs) {
      await storage.deleteCV(cv.id);
    }

    // Delete user account
    await storage.deleteUser(userId);

    // Logout user
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
      }
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
}));

export default router;

