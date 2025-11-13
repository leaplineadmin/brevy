import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { z } from 'zod';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { cvDrafts, draftPayloadSchema } from '@shared/schema';
import cvParserRoutes from './cvParser.routes';

const router = Router();

// CV Parser routes (upload and analysis)
router.use('/', cvParserRoutes);

// Validation schemas
const draftIdSchema = z.object({
  id: z.string().uuid()
});

// Get all drafts for user
router.get('/drafts', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  
  const drafts = await db
    .select()
    .from(cvDrafts)
    .where(eq(cvDrafts.userId, userId))
    .orderBy(cvDrafts.updatedAt);

  res.json(drafts);
}));

// Get specific draft
router.get('/drafts/:id', requireAuth, validateParams(draftIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const draft = await db
    .select()
    .from(cvDrafts)
    .where(and(eq(cvDrafts.id, id), eq(cvDrafts.userId, userId)))
    .limit(1);

  if (draft.length === 0) {
    return res.status(404).json({ message: "Draft not found" });
  }

  res.json(draft[0]);
}));

// Create new draft
router.post('/drafts', requireAuth, validateBody(draftPayloadSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const draftData = req.body;
  
  const newDraft = await db
    .insert(cvDrafts)
    .values({
      ...draftData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  res.status(201).json(newDraft[0]);
}));

// Update draft
router.put('/drafts/:id', requireAuth, validateParams(draftIdSchema), validateBody(draftPayloadSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const draftData = req.body;
  
  const updatedDraft = await db
    .update(cvDrafts)
    .set({
      ...draftData,
      updatedAt: new Date()
    })
    .where(and(eq(cvDrafts.id, id), eq(cvDrafts.userId, userId)))
    .returning();

  if (updatedDraft.length === 0) {
    return res.status(404).json({ message: "Draft not found" });
  }

  res.json(updatedDraft[0]);
}));

// Delete draft
router.delete('/drafts/:id', requireAuth, validateParams(draftIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deletedDraft = await db
    .delete(cvDrafts)
    .where(and(eq(cvDrafts.id, id), eq(cvDrafts.userId, userId)))
    .returning();

  if (deletedDraft.length === 0) {
    return res.status(404).json({ message: "Draft not found" });
  }

  res.json({ message: "Draft deleted successfully" });
}));

export default router;
