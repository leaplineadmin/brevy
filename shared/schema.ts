import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  hasActiveSubscription: boolean("has_active_subscription").default(false),
  // premiumUntil: timestamp("premium_until"), // Date until which user has premium access - temporairement commenté
  language: varchar("language").default("en"), // User's preferred language
  acceptedTerms: boolean("accepted_terms").default(false), // User accepted terms of service
  acceptedPrivacy: boolean("accepted_privacy").default(false), // User accepted privacy policy
  termsAcceptedAt: timestamp("terms_accepted_at"), // Timestamp when user accepted terms
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  cvs: many(cvs),
}));

export const cvs = pgTable("cvs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'A4' or 'digital'
  templateId: text("template_id").notNull(),
  mainColor: text("main_color").notNull(),
  data: jsonb("data").notNull(),
  subdomain: text("subdomain"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  publishedLanguage: varchar("published_language").default("en"), // Language of the published CV
  isPremiumLocked: boolean("is_premium_locked").default(false).notNull(),
  requiresPremium: boolean("requires_premium").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cvsRelations = relations(cvs, ({ one }) => ({
  user: one(users, {
    fields: [cvs.userId],
    references: [users.id],
  }),
}));

// Table pour la suppression différée des comptes
export const deletedUsers = pgTable("deleted_users", {
  id: varchar("id").primaryKey(),
  originalUserId: varchar("original_user_id").notNull(),
  email: varchar("email").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // 10 jours après suppression
});

// Draft status enum for cv_drafts
export const draftStatusEnum = pgEnum("draft_status", ["draft", "claimed", "converted"]);

// CV Drafts table - temporary storage before user authentication/conversion
export const cvDrafts = pgTable("cv_drafts", {
  id: varchar("id").primaryKey(), // UUID generated in application code
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // nullable until claimed
  anonId: varchar("anon_id"), // anonymous session identifier (cookie-based)
  payload: jsonb("payload").notNull(), // Full CV data + templateId + settings
  hash: text("hash").notNull(), // SHA256 hash of payload for idempotence
  status: draftStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // TTL 48h after creation
}, (table) => [
  // Unique constraint on hash for idempotence (prevent duplicate drafts)
  unique("unique_draft_hash").on(table.hash),
  // Index on expires_at for efficient cleanup
  index("idx_drafts_expires_at").on(table.expiresAt),
  // Index on user_id for efficient user queries
  index("idx_drafts_user_id").on(table.userId),
  // Index on anon_id for anonymous session lookups
  index("idx_drafts_anon_id").on(table.anonId),
]);

export const cvDraftsRelations = relations(cvDrafts, ({ one }) => ({
  user: one(users, {
    fields: [cvDrafts.userId],
    references: [users.id],
  }),
}));

// Experience schema for type safety in the CV data
export const experienceSchema = z.object({
  id: z.string(),
  position: z.string().optional(), // instead of jobTitle
  company: z.string().optional(),
  location: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  startMonth: z.string().optional(),
  startYear: z.string().optional(),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  current: z.boolean().optional(),
  isCurrent: z.boolean().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

export type Experience = z.infer<typeof experienceSchema>;

// Education schema for type safety in the CV data
export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().optional(),
  diploma: z.string().optional(),
  school: z.string().optional(),
  location: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  startMonth: z.string().optional(),
  startYear: z.string().optional(),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  description: z.string().optional(),
});

export type Education = z.infer<typeof educationSchema>;

// Skill schema for type safety in the CV data
export const skillSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  level: z.enum(["beginner", "medium", "advanced", "expert"]).optional(),
  showLevel: z.boolean().optional().default(true),
});

export type Skill = z.infer<typeof skillSchema>;

// Language schema for type safety in the CV data
export const languageSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  level: z.string().optional(),
});

export type Language = z.infer<typeof languageSchema>;

// Certification schema
export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export type Certification = z.infer<typeof certificationSchema>;

// Hobby schema
export const hobbySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export type Hobby = z.infer<typeof hobbySchema>;

// Tools schema
export const toolSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  level: z.enum(["beginner", "medium", "advanced", "expert"]).optional(),
  showLevel: z.boolean().optional(),
});

export type Tool = z.infer<typeof toolSchema>;

// Distinction schema
export const distinctionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  date: z.string().optional(),
});

export type Distinction = z.infer<typeof distinctionSchema>;

// Personal info schema
export const personalInfoSchema = z.object({
  photoUrl: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  position: z.string().optional(), // job title/position
  email: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

// Complete CV data schema
export const cvDataSchema = z.object({
  personalInfo: personalInfoSchema.optional(),
  photoUrl: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  position: z.string().optional(), // job title/position
  email: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().optional(),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
  languages: z.array(languageSchema).default([]),
  tools: z.array(toolSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  hobbies: z.array(hobbySchema).optional(),
  distinctions: z.array(distinctionSchema).optional(),
  // Préférences d'affichage
  displaySettings: z.object({
    hidePhoto: z.boolean().default(false),
    hideCity: z.boolean().default(false),
    hideSkillLevels: z.boolean().default(false),
    hideToolLevels: z.boolean().default(false),
    hideLanguageLevels: z.boolean().default(false),
    hideLinkedIn: z.boolean().default(false),
    hideWebsite: z.boolean().default(false),
  }).optional(),
});

export type CVData = z.infer<typeof cvDataSchema>;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type DeletedUser = typeof deletedUsers.$inferSelect;
export type InsertDeletedUser = typeof deletedUsers.$inferInsert;

export const insertCVSchema = createInsertSchema(cvs).pick({
  userId: true,
  title: true,
  type: true,
  templateId: true,
  mainColor: true,
  data: true,
  subdomain: true,
});

export type InsertCV = z.infer<typeof insertCVSchema>;

// Draft payload schema - what gets stored in cv_drafts.payload
export const draftPayloadSchema = z.object({
  title: z.string(),
  templateId: z.string(),
  templateType: z.enum(["digital", "A4"]).default("digital"),
  mainColor: z.string(),
  cvData: cvDataSchema,
  displaySettings: z.object({
    hidePhoto: z.boolean().default(false),
    hideCity: z.boolean().default(false),
    hideSkillLevels: z.boolean().default(false),
    hideToolLevels: z.boolean().default(false),
    hideLanguageLevels: z.boolean().default(false),
    hideLinkedIn: z.boolean().default(false),
    hideWebsite: z.boolean().default(false),
  }).optional(),
});

export type DraftPayload = z.infer<typeof draftPayloadSchema>;

// CV Draft schemas for API
export const insertCVDraftSchema = createInsertSchema(cvDrafts).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const claimDraftSchema = z.object({
  draftId: z.string().uuid(),
});

export const convertDraftSchema = z.object({
  draftId: z.string().uuid(),
});

export type InsertCVDraft = z.infer<typeof insertCVDraftSchema>;
export type CVDraft = typeof cvDrafts.$inferSelect;
export type ClaimDraft = z.infer<typeof claimDraftSchema>;
export type ConvertDraft = z.infer<typeof convertDraftSchema>;
export type CV = typeof cvs.$inferSelect & {
  // Extend CV type to include all CVData properties for template access
  personalInfo?: PersonalInfo;
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phoneCountryCode?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  languages?: Language[];
  tools?: Tool[];
  certifications?: Certification[];
  hobbies?: Hobby[];
  style?: any;
};
