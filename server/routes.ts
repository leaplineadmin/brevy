import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { s3Service } from "./s3Service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import { users as usersTable, cvDrafts, draftPayloadSchema, type CV } from "@shared/schema";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import crypto from "crypto";
import { createLogContext, type LogContext } from '../shared/correlation';
import cvRoutes from "./routes/cv.routes";
import userRoutes from "./routes/user.routes";
import OpenAI from "openai";

// Initialize Stripe with proper version
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any,
    })
  : null;

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

type JobSearchProfile = {
  title: string;
  location: string;
  country_code: string;
  keywords: string[];
};

type JobMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  remoteAvailable?: boolean;
  matchScore?: number;
};

const JOB_PROFILE_SYSTEM_PROMPT = `You are an assistant that extracts job-search parameters from resumes. 
Your task is to analyze the resume and return a compact JSON object describing what kind of job the candidate is currently looking for.
Always answer with STRICT JSON only. Do not include any explanation, comments or markdown.`;

const buildJobProfileUserPrompt = (resumeText: string) => `Here is the resume content:
---
${resumeText}
---
From this resume, infer the most relevant current job search target and return a JSON object with:
- "title": a short English job title for the target role (e.g. "Senior Sales Engineer", "Product Manager", "Data Analyst").
- "location": the preferred city and country written as "City, Country" (try to infer from the resume; if unknown, put an empty string).
- "country_code": a 2-letter lowercase ISO country code for the main job search country (e.g. "fr", "us", "de"). If you cannot infer it, guess the most likely country from the resume language and cities.
- "keywords": an array of 5 to 10 key technical or functional keywords that describe the target role (skills, technologies, domain).

Example of the expected JSON format:
{
  "title": "Sales Engineer",
  "location": "Paris, France",
  "country_code": "fr",
  "keywords": ["SaaS", "B2B", "pre-sales", "CRM", "HubSpot"]
}`;

const truncate = (value: string, limit = 600) => {
  if (!value) return "";
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
};

const parseCvDataPayload = (cv: CV) => {
  try {
    const rawData = typeof cv.data === "string" ? JSON.parse(cv.data) : cv.data;
    if (rawData && typeof rawData === "object" && "cvData" in rawData) {
      return (rawData as any).cvData || {};
    }
    return rawData || {};
  } catch (error) {
    console.warn("Failed to parse CV data payload", error);
    return {};
  }
};

const buildResumeText = (cv: CV): string => {
  const data = parseCvDataPayload(cv) as any;
  const personal = data?.personalInfo || data || {};
  const lines: string[] = [];

  lines.push(`Resume title: ${cv.title || "Untitled resume"}`);

  const name = [personal?.firstName || cv.firstName, personal?.lastName || cv.lastName]
    .filter(Boolean)
    .join(" ");
  if (name) {
    lines.push(`Name: ${name}`);
  }

  const position = personal?.position || personal?.jobTitle || cv.position;
  if (position) {
    lines.push(`Target position: ${position}`);
  }

  const location = [personal?.city || cv.city, personal?.country || cv.country].filter(Boolean).join(", ");
  if (location) {
    lines.push(`Location: ${location}`);
  }

  const summary = personal?.summary || cv.summary;
  if (summary) {
    lines.push(`Summary: ${summary}`);
  }

  if (Array.isArray(data?.skills) && data.skills.length > 0) {
    const skills = data.skills
      .map((skill: any) => skill?.name)
      .filter(Boolean)
      .join(", ");
    if (skills) {
      lines.push(`Skills: ${skills}`);
    }
  }

  if (Array.isArray(data?.experience) && data.experience.length > 0) {
    lines.push("Experience:");
    data.experience.forEach((exp: any) => {
      const period = [exp?.from || exp?.startMonth, exp?.to || exp?.endMonth].filter(Boolean).join(" - ");
      const experienceHeader = [exp?.position || exp?.jobTitle, exp?.company, exp?.location, period]
        .filter(Boolean)
        .join(" | ");
      if (experienceHeader) {
        lines.push(`- ${experienceHeader}`);
      }
      if (exp?.summary || exp?.description) {
        lines.push(`  ${exp.summary || exp.description}`);
      }
    });
  }

  if (Array.isArray(data?.education) && data.education.length > 0) {
    lines.push("Education:");
    data.education.forEach((edu: any) => {
      const educationHeader = [edu?.degree || edu?.diploma, edu?.school, edu?.location]
        .filter(Boolean)
        .join(" | ");
      if (educationHeader) {
        lines.push(`- ${educationHeader}`);
      }
    });
  }

  return lines.filter(Boolean).join("\n");
};

const generateJobSearchProfile = async (resumeText: string): Promise<JobSearchProfile> => {
  if (!openaiClient) {
    throw new Error("openai_unavailable");
  }

  const completion = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_JOB_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: JOB_PROFILE_SYSTEM_PROMPT },
      { role: "user", content: buildJobProfileUserPrompt(resumeText) },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("profile_generation_failed");
  }

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || "",
      location: parsed.location || "",
      country_code: (parsed.country_code || "us").toLowerCase(),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
    };
  } catch (error) {
    const parseError = new Error("profile_parse_error");
    (parseError as any).cause = error;
    throw parseError;
  }
};

const normalizeJob = (job: any): JobMatch => {
  const locationParts = [job?.job_city, job?.job_state, job?.job_country].filter(Boolean);
  const location = locationParts.join(", ") || job?.job_country || "Remote";
  const description =
    job?.job_description ||
    (Array.isArray(job?.job_highlights) ? job.job_highlights.join("\n") : "") ||
    "";

  return {
    id:
      job?.job_id ||
      `${job?.job_title || "job"}-${job?.employer_name || "company"}-${job?.job_city || ""}-${job?.job_country || ""}`,
    title: job?.job_title || "Job opportunity",
    company: job?.employer_name || "Company confidential",
    location,
    url: job?.job_apply_link || job?.job_offer_link || job?.job_google_link || job?.job_url || "",
    description: truncate(description),
    remoteAvailable: Boolean(job?.job_is_remote),
    matchScore: typeof job?.job_score === "number" ? job.job_score : undefined,
  };
};

const fetchJobMatchesForProfile = async (profile: JobSearchProfile): Promise<JobMatch[]> => {
  const { RAPIDAPI_HOST, RAPIDAPI_KEY } = process.env;
  if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) {
    throw new Error("missing_rapidapi_env");
  }

  const keywordString = (profile.keywords || []).join(" ");
  const query = [profile.title, profile.location, keywordString].filter(Boolean).join(" ").trim() || profile.title || keywordString || "job opportunity";
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    country: (profile.country_code || "us").toLowerCase(),
    date_posted: "week",
  });

  const url = `https://${RAPIDAPI_HOST}/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const error = new Error("job_api_error");
    (error as any).statusCode = 502;
    throw error;
  }

  const payload = await response.json();
  const rawJobs = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.jobs)
    ? payload.jobs
    : [];

  return rawJobs.map(normalizeJob).filter((job) => Boolean(job.url));
};

// Configure multer for file uploads - utilise la mémoire pour traiter les fichiers avant S3
const upload = multer({
  storage: multer.memoryStorage(), // Stockage en mémoire pour traitement avant S3
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Seuls les fichiers JPEG, PNG, GIF et WebP sont autorisés'));
    }
    cb(null, true);
  }
});

// Configuration de fallback pour stockage local si S3 n'est pas disponible
const localUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Seuls les fichiers JPEG, PNG, GIF et WebP sont autorisés'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes are now setup in server/index.ts before subdomain middleware
  
  // Utility function for consistent authentication checking
  const checkAuthentication = (req: any, res: any, next?: () => void) => {
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    if (!isAuthenticated) {
      res.status(401).json({ message: "Not authenticated" });
      return false;
    }
    if (next) next();
    return true;
  };

  // Current authenticated user
  app.get("/api/user", (req: any, res) => {

    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    if (isAuthenticated) {
      return res.json(req.user);
    }
    
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Mount CV routes (includes /api/cv/parse-upload)
  app.use('/api/cv', cvRoutes);

  // Mount User routes (GDPR, data management, etc.)
  app.use('/api/user', userRoutes);

  // Email/password registration
  app.post("/api/register", async (req: any, res) => {
    try {
      const { username, email, password, firstName, lastName, language } = req.body || {};
      const userEmail = email || username;
      if (!userEmail || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existing = await storage.getUserByEmail(userEmail);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Create bare user, then set password
      const newId = uuidv4();
      await storage.upsertUser({
        id: newId,
        email: userEmail,
        firstName: firstName || "",
        lastName: lastName || "",
        language: language || "en", // Default to English if not provided
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      const created = await storage.updateUser(newId, { password: hashedPassword });

      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('./email');
        await sendWelcomeEmail(created.email!, created.firstName || 'User');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      // Establish session
      req.login(created, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.json(created);
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Email/password login
  app.post("/api/login", async (req: any, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByEmail(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.password) {
        return res.status(401).json({ message: "This account was created with Google. Please use 'Continue with Google' to sign in." });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      

      // Remove password before sending to client
      const { password: _pw, ...publicUser } = user as any;

      req.login(publicUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        return res.json(publicUser);
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      req.session?.destroy(() => {
        res.json({ message: "Logged out" });
      });
    });
  });

  // ==========================================
  // CV DRAFTS API - Infaillible draft system
  // ==========================================

  // Helper function to generate SHA256 hash of payload for idempotence
  const generatePayloadHash = (payload: any): string => {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  };

  // Helper function to get or create anonymous ID cookie
  const getOrCreateAnonId = (req: any, res: any): string => {
    let anonId = req.cookies?.anon_id;
    if (!anonId) {
      anonId = uuidv4();
      // Set HttpOnly cookie for 48h (same as draft TTL)
      res.cookie('anon_id', anonId, {
        httpOnly: true,
        maxAge: 48 * 60 * 60 * 1000, // 48 hours
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    return anonId;
  };

  // Helper function to check draft ownership (anon_id or user_id)
  const canAccessDraft = (draft: any, anonId: string, userId?: string): boolean => {
    if (userId && draft.userId === userId) return true; // User owns claimed draft
    if (!draft.userId && draft.anonId === anonId) return true; // Anonymous owns unclaimed draft
    return false;
  };

  // POST /api/cv-drafts - Create/replace draft (public, no auth required)
  app.post("/api/cv-drafts", async (req, res) => {
    try {
      const logCtx = createLogContext(req, { action: 'draft:create' });
      
      // Validate payload with Zod
      const validationResult = draftPayloadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validationResult.error.errors 
        });
      }

      const payload = validationResult.data;
      const anonId = getOrCreateAnonId(req, res);
      const hash = generatePayloadHash(payload);
      const draftId = uuidv4();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL - Immediate signup flow
      
      logCtx.draftId = draftId;


      // Try to insert with idempotence (ON CONFLICT DO NOTHING via unique hash)
      try {
        await db.insert(cvDrafts).values({
          id: draftId,
          userId: null, // Not claimed yet
          anonId: anonId,
          payload: payload as any,
          hash: hash,
          status: 'draft',
          expiresAt: expiresAt
        });


        return res.status(201).json({ draftId });
      } catch (error: any) {
        // Check if it's a unique constraint violation (hash collision)
        if (error.code === '23505' && error.constraint?.includes('unique_draft_hash')) {
          // Find existing draft with same hash
          const existingDraft = await db.select().from(cvDrafts).where(eq(cvDrafts.hash, hash)).limit(1);
          if (existingDraft.length > 0 && existingDraft[0]) {
            const draft = existingDraft[0];
            const now = new Date();
            
            // Check if the existing draft is still usable (not expired, not claimed, still in draft status)
            const isExpired = now > draft.expiresAt;
            const isClaimed = draft.userId !== null;
            const isNotDraft = draft.status !== 'draft';
            const isDifferentAnon = draft.anonId && draft.anonId !== anonId;
            
            
            if (isExpired || isClaimed || isNotDraft || isDifferentAnon) {
              // Reset the existing draft to be usable again (avoids unique constraint violation)
              const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL - Immediate signup flow
              
              await db.update(cvDrafts)
                .set({ 
                  userId: null,  // Reset to unclaimed
                  anonId: anonId,  // Assign to current session
                  payload: payload as any,  // Update with current data
                  status: 'draft',  // Reset to draft status
                  expiresAt: newExpiresAt  // Fresh TTL
                })
                .where(eq(cvDrafts.id, draft.id));
              
              
              return res.status(200).json({ draftId: draft.id });
            } else {
              // The existing draft is still usable - extend its TTL and reuse it
              const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL - Immediate signup flow
              
              await db.update(cvDrafts)
                .set({ 
                  expiresAt: newExpiresAt,
                  anonId: anonId // Update anonId to current session for continuity
                })
                .where(eq(cvDrafts.id, draft.id));
              
              
              return res.status(200).json({ draftId: draft.id });
            }
          }
        }
        throw error;
      }
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to create draft", error: error.message });
    }
  });

  // POST /api/cv-drafts/:id/claim - Claim draft for authenticated user
  app.post("/api/cv-drafts/:id/claim", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const draftId = req.params.id;
      const userId = req.user.id;
      const anonId = req.cookies?.anon_id;


      // Find the draft
      const drafts = await db.select().from(cvDrafts).where(eq(cvDrafts.id, draftId)).limit(1);
      if (drafts.length === 0) {
        return res.status(404).json({ message: "Draft not found" });
      }

      const draft = drafts[0];
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      // Check if draft is expired
      if (new Date() > draft.expiresAt) {
        return res.status(410).json({ message: "Draft has expired" });
      }

      // Verify ownership before claiming
      if (!canAccessDraft(draft, anonId || '', userId)) {
        return res.status(403).json({ message: "Not authorized to claim this draft" });
      }

      // Claim the draft (attach to user)
      await db.update(cvDrafts)
        .set({ 
          userId: userId,
          status: 'claimed' as any
        })
        .where(eq(cvDrafts.id, draftId));


      return res.json({ success: true, draftId });
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to claim draft", error: error.message });
    }
  });

  // POST /api/cv-drafts/:id/convert - Convert draft to final CV
  app.post("/api/cv-drafts/:id/convert", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const draftId = req.params.id;
      const userId = req.user.id;
      const anonId = req.cookies?.anon_id;

      const logCtx = createLogContext(req, { action: 'draft:convert:start', draftId, userId });
      
      // E) Backend convert blindé - log all checks (per brief specification)

      // Find the draft
      const drafts = await db.select().from(cvDrafts).where(eq(cvDrafts.id, draftId)).limit(1);
      if (drafts.length === 0) {
        return res.status(404).json({ message: "Draft not found" }); // 404: per brief spec
      }

      const draft = drafts[0];
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      // Check if draft is expired  
      if (new Date() > draft.expiresAt) {
        return res.status(410).json({ message: "Draft expired" }); // 410: per brief spec
      }

      // CRITICAL FIX: For premium subscription flow, allow authenticated users to convert drafts
      // This handles the case where a draft was created by an unauthenticated user,
      // then the user authenticated and should be able to convert the draft
      const payload = draft.payload as any;
      const premiumTemplates = ["template-boxes", "template-technical", "template-datalover", "template-landing"];
      const isPremiumTemplate = premiumTemplates.includes(payload.templateId);
      
      // SIMPLIFIED: Always allow conversion for authenticated users (simplified workflow per user request)
      // The user requested all saves go through "Save my Resume" and work for everyone
      const hasOwnership = canAccessDraft(draft, anonId || '', userId);
      const isAuthenticatedUser = req.isAuthenticated && req.isAuthenticated();
      
      // Enhanced logging for debugging ownership issues
      console.log('Draft convert ownership check:', {
        draftId,
        userId,
        anonId,
        draftUserId: draft.userId,
        draftAnonId: draft.anonId,
        hasOwnership,
        isAuthenticatedUser
      });
      
      // Only block if not authenticated (basic security)
      if (!isAuthenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // ENHANCED: More flexible ownership check for authenticated users
      // Allow conversion if:
      // 1. User owns the draft (userId matches)
      // 2. Draft is unclaimed (no userId) and anonId matches
      // 3. Draft is unclaimed and no anonId match (allow authenticated users to claim any unclaimed draft)
      const isUnclaimedDraft = !draft.userId;
      const canClaimUnclaimed = isUnclaimedDraft && isAuthenticatedUser;
      
      if (!hasOwnership && !canClaimUnclaimed) {
        console.log('Ownership check failed:', { hasOwnership, canClaimUnclaimed, isUnclaimedDraft });
        return res.status(403).json({ message: "Not owner" });
      }
      

      // Premium template validation
      const user = await storage.getUser(userId);
      const { hasActivePremiumAccess } = await import('./utils/premium-check');
      const hasSubscription = user ? hasActivePremiumAccess(user) : false;
      
      // NOUVELLE LOGIQUE: Toujours créer le CV, mais avec état locked si premium sans subscription

      // Convert draft to CV (transactional)  
      const cvData = {
        userId: userId,
        title: (payload as any).title || 'My Resume',
        type: (payload as any).templateType || 'digital',
        templateId: (payload as any).templateId || 'template-classic',
        mainColor: (payload as any).mainColor || '#0076d1',
        data: JSON.stringify({
          cvData: (payload as any).cvData || {},
          displaySettings: (payload as any).displaySettings || {}
        }),
        subdomain: null, // Can be set later
        isPremiumLocked: isPremiumTemplate && !hasSubscription, // Lock si template premium sans subscription
        requiresPremium: isPremiumTemplate // Marque si le template nécessite premium
      };

      let cvId: string;
      let wasDeduped = false;

      try {
        // Create the final CV
        const newCV = await storage.createCV(cvData);
        cvId = newCV.id;

        // Mark draft as converted
        await db.update(cvDrafts)
          .set({ status: 'converted' as any })
          .where(eq(cvDrafts.id, draftId));


      } catch (error: any) {
        // Handle potential duplicate CV creation (same hash)
        if (error.message?.includes('duplicate') || error.code === '23505') {
          
          // Find existing CV with same user and similar content
          const existingCVs = await storage.getCVsByUserId(userId);
          const matchingCV = existingCVs.find((cv: any) => {
            try {
              const cvDataParsed = JSON.parse(cv.data);
              return cv.templateId === payload.templateId && 
                     cv.mainColor === payload.mainColor &&
                     cv.title === payload.title;
            } catch {
              return false;
            }
          });

          if (matchingCV) {
            cvId = matchingCV.id;
            wasDeduped = true;
            
            // Still mark draft as converted
            await db.update(cvDrafts)
              .set({ status: 'converted' as any })
              .where(eq(cvDrafts.id, draftId));
          } else {
            throw error; // Re-throw if not a dedup case
          }
        } else {
          throw error;
        }
      }


      return res.json({ 
        success: true, 
        cvId, 
        draftId,
        dedupe: wasDeduped 
      });

    } catch (error: any) {
      // Jamais 500 silencieux → logger et renvoyer code + message stable (per brief specification)
      const errorLogCtx = createLogContext(req, { action: 'draft:convert:error', draftId: req.params.id });
      
      // Return stable error message, never expose internals
      return res.status(422).json({ message: "Invalid draft" }); // 422: per brief spec
    }
  });

  // GeoIP detection route with development mode support
  app.get("/api/geoip", (req, res) => {
    try {
      let country = null;

      // Development mode detection (only in non-production environments)
      const isDev = process.env.NODE_ENV !== 'production';
      
      console.log('GeoIP request:', {
        isDev,
        headers: {
          'cf-ipcountry': req.headers['cf-ipcountry'],
          'x-vercel-ip-country': req.headers['x-vercel-ip-country'],
          'user-agent': req.headers['user-agent']
        },
        cookies: req.cookies,
        query: req.query
      });
      
      if (isDev) {
        // 1. Check cookie mock-country (ISO2)
        const cookieCountry = req.cookies?.['mock-country'];
        if (cookieCountry && /^[A-Z]{2}$/.test(cookieCountry)) {
          country = cookieCountry;
          console.log('Using cookie country:', country);
        }
        
        // 2. Check query parameter ?country=XX
        if (!country) {
          const queryCountry = req.query.country as string;
          if (queryCountry && /^[A-Z]{2}$/.test(queryCountry.toUpperCase())) {
            country = queryCountry.toUpperCase();
            console.log('Using query country:', country);
          }
        }
        
        // 3. Check environment variable DEV_GEOIP_COUNTRY
        if (!country) {
          const envCountry = process.env.DEV_GEOIP_COUNTRY;
          if (envCountry && /^[A-Z]{2}$/.test(envCountry)) {
            country = envCountry;
            console.log('Using env country:', country);
          }
        }
      }

      // 4. Production headers (Cloudflare/Vercel)
      if (!country) {
        const cfCountry = req.headers['cf-ipcountry'] as string;
        const vercelCountry = req.headers['x-vercel-ip-country'] as string;
        
        country = cfCountry || vercelCountry || null;
        
        if (country) {
          console.log('Using header country:', country, 'from', cfCountry ? 'Cloudflare' : 'Vercel');
        }
      }
      
      console.log('Final GeoIP result:', country);
      res.json({ country });
    } catch (error) {
      console.error('GeoIP error:', error);
      res.json({ country: null });
    }
  });

  // Language detection route
  app.get("/api/detect-language", (req, res) => {
    // For V1, always return English regardless of location or preferences
    res.cookie('lang', 'en', { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
    res.json({ language: 'en' });
  });

  // Set language preference
  app.post("/api/set-language", express.json(), async (req, res) => {
    try {
      const { language } = req.body;
      if (!language || !['en', 'fr'].includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }

      // Set cookie for language preference
      res.cookie('lang', language, { 
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // If user is authenticated, update their language preference in database
      if (req.user && req.user.id) {
        await storage.updateUser(req.user.id, { language });
      }

      res.json({ success: true, language });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to set language" });
    }
  });

  // NEW: Mode debug éphémère (per brief specification) - ONLY in non-production
  if (process.env.NODE_ENV !== 'production') {
    
    // Debug draft metadata (anonymized)
    app.get('/api/cv-drafts/_debug/:id', async (req, res) => {
      try {
        const draftId = req.params.id;
        const logCtx = createLogContext(req, { action: 'draft:debug', draftId });
        
        const drafts = await db.select().from(cvDrafts).where(eq(cvDrafts.id, draftId)).limit(1);
        if (drafts.length === 0) {
          return res.status(404).json({ message: "Draft not found" });
        }
        
        const draft = drafts[0];
        if (!draft) {
          return res.status(404).json({ message: "Draft not found" });
        }
        
        const now = new Date();
        const isExpired = now > draft.expiresAt;
        
        return res.json({
          id: draftId.substring(0, 8) + '...',
          owner: draft.userId ? `user:${draft.userId.substring(0, 8)}...` : `anon:${draft.anonId?.substring(0, 8)}...`,
          status: draft.status === 'converted' ? 'converted' : (isExpired ? 'expired' : 'active'),
          createdAt: draft.createdAt,
          expiresAt: draft.expiresAt,
          hasPayload: !!draft.payload,
          payloadHash: draft.hash?.substring(0, 8) + '...'
        });
      } catch (error: any) {
        return res.status(500).json({ message: "Debug error" });
      }
    });
  }

  // CV API routes
  app.get("/api/cvs", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const logCtx = createLogContext(req, { action: 'cvs:list', userId: req.user.id });
      
      const userId = req.user.id;
      
      // Get user's current subscription status
      const user = await storage.getUser(userId);
      const { hasActivePremiumAccess } = await import('./utils/premium-check');
      const hasActiveSubscription = user ? hasActivePremiumAccess(user) : false;
      
      const cvs = await storage.getCVsByUserId(userId);
      
      // Dynamically calculate isPremiumLocked based on current subscription status
      const premiumTemplates = ["template-boxes", "template-technical", "template-datalover", "template-landing"];
      
      const cvsWithUpdatedLockStatus = cvs.map(cv => ({
        ...cv,
        isPremiumLocked: premiumTemplates.includes(cv.templateId) && !hasActiveSubscription,
        requiresPremium: premiumTemplates.includes(cv.templateId)
      }));
      
      
      return res.json(cvsWithUpdatedLockStatus);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cvs/:id", async (req, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const cv = await storage.getCVById(req.params.id); // Ne plus parser en int, garder string
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this CV" });
      }

      return res.json(cv);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/resumes/:id/jobs", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    const { RAPIDAPI_KEY, RAPIDAPI_HOST } = process.env;
    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
      console.warn("Resume job matches requested but RapidAPI env vars are missing");
      return res.status(500).json({ error: "missing_rapidapi_env" });
    }

    if (!openaiClient) {
      console.warn("Resume job matches requested but OpenAI client is not configured");
      return res.status(500).json({ error: "server_error" });
    }

    try {
      const resumeId = req.params.id;
      const cv = await storage.getCVById(resumeId);

      if (!cv) {
        return res.status(404).json({ error: "resume_not_found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ error: "forbidden" });
      }

      const resumeText = buildResumeText(cv);
      const profile = await generateJobSearchProfile(resumeText);
      const jobs = await fetchJobMatchesForProfile(profile);

      return res.json({ profile, jobs });
    } catch (error: any) {
      if (error?.message === "job_api_error" || error?.statusCode === 502) {
        console.error("Job API error:", error);
        return res.status(502).json({ error: "job_api_error" });
      }

      if (error?.message === "missing_rapidapi_env") {
        console.warn("Missing RapidAPI env vars while fetching job matches");
        return res.status(500).json({ error: "missing_rapidapi_env" });
      }

      console.error("Failed to load resume job matches:", error);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/cvs", async (req, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { title, templateType, templateId, mainColor, cvData, displaySettings, language } = req.body;
      
      // Premium template validation  
      const premiumTemplates = ["template-boxes", "template-technical", "template-datalover", "template-landing"];
      const isPremiumTemplate = premiumTemplates.includes(templateId);
      const user = await storage.getUser(req.user.id);
      const { hasActivePremiumAccess } = await import('./utils/premium-check');
      const hasSubscription = user ? hasActivePremiumAccess(user) : false;
      
      // Allow premium template saves but mark as locked if no subscription
      if (isPremiumTemplate && !hasSubscription) {
      }
      
      
      // S'assurer que type n'est jamais null
      const validType = templateType || 'digital';
      
      // Sync CV data to user profile if firstName/lastName are missing
      if (cvData?.firstName && cvData?.lastName && (!user?.firstName || !user?.lastName)) {
        try {
          await storage.updateUser(req.user.id, {
            firstName: cvData.firstName,
            lastName: cvData.lastName
          });
        } catch (error) {
          // Don't fail CV creation if user update fails
          console.error('Failed to sync CV data to user profile:', error);
        }
      }
      
      // Convertir les données au format attendu par le storage
      const cvDataToCreate = {
        userId: req.user.id,
        title: title || 'Mon CV',
        type: validType,
        templateId: templateId || 'template-classic',
        mainColor: mainColor || '#0076d1',
        data: JSON.stringify({
          cvData: cvData || {},
          displaySettings: displaySettings || {},
          language: language || user?.language || 'en' // Use provided language, user's language, or default to English
        }),
        subdomain: null, // Peut être ajouté plus tard
        isPremiumLocked: isPremiumTemplate && !hasSubscription, // Lock if premium template without subscription
        requiresPremium: isPremiumTemplate // Mark if template requires premium
      };
      
      
      const newCV = await storage.createCV(cvDataToCreate);

      return res.status(201).json(newCV);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/cvs/:id", async (req, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const cvId = req.params.id; // String ID au lieu de number
      console.log('🔍 [CV UPDATE] Attempting to update CV:', cvId);
      console.log('🔍 [CV UPDATE] User ID:', req.user?.id);
      
      const cv = await storage.getCVById(cvId);
      
      if (!cv) {
        console.log('❌ [CV UPDATE] CV not found:', cvId);
        return res.status(404).json({ message: "CV not found" });
      }

      console.log('🔍 [CV UPDATE] CV found, owner ID:', cv.userId, 'Type:', typeof cv.userId);
      console.log('🔍 [CV UPDATE] Requesting user ID:', req.user.id, 'Type:', typeof req.user.id);
      console.log('🔍 [CV UPDATE] IDs match?', cv.userId === req.user.id);
      console.log('🔍 [CV UPDATE] String comparison:', String(cv.userId) === String(req.user.id));
      
      if (cv.userId !== req.user.id) {
        console.log('❌ [CV UPDATE] Authorization failed - CV owner:', cv.userId, 'Requesting user:', req.user.id);
        console.log('❌ [CV UPDATE] Owner type:', typeof cv.userId, 'User type:', typeof req.user.id);
        return res.status(403).json({ message: "Not authorized to update this CV" });
      }
      
      console.log('✅ [CV UPDATE] Authorization successful for CV:', cvId);

      const { title, templateType, templateId, mainColor, cvData, displaySettings, subdomain, language } = req.body;
      
      // Sync CV data to user profile if firstName/lastName are missing
      if (cvData?.firstName && cvData?.lastName) {
        const user = await storage.getUser(req.user.id);
        if (!user?.firstName || !user?.lastName) {
          try {
            await storage.updateUser(req.user.id, {
              firstName: cvData.firstName,
              lastName: cvData.lastName
            });
          } catch (error) {
            // Don't fail CV update if user update fails
            console.error('Failed to sync CV data to user profile:', error);
          }
        }
      }
      
      // Check if switching to premium template and user doesn't have subscription
      const premiumTemplates = ["template-boxes", "template-technical", "template-datalover", "template-landing"];
      const isPremiumTemplate = premiumTemplates.includes(templateId);
      const user = await storage.getUser(req.user.id);
      const { hasActivePremiumAccess } = await import('./utils/premium-check');
      const hasSubscription = user ? hasActivePremiumAccess(user) : false;
      
      // If switching to premium template without subscription, unpublish the CV
      let updateData: any = {
        title: title || cv.title,
        type: templateType || cv.type,
        templateId: templateId || cv.templateId,
        mainColor: mainColor || cv.mainColor,
        data: JSON.stringify({
          cvData: cvData || {},
          displaySettings: displaySettings || {},
          language: language || user?.language || 'en' // Use provided language, user's language, or default to English
        }),
        subdomain: subdomain || cv.subdomain
      };
      
      if (isPremiumTemplate && !hasSubscription && cv.isPublished) {
        console.log('🔍 [CV UPDATE] Unpublishing CV due to premium template switch without subscription');
        updateData = {
          ...updateData,
          subdomain: null,
          isPublished: false,
          publishedAt: null
        };
      }
      
      const updatedCV = await storage.updateCV(cvId, updateData);

      return res.json(updatedCV);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cvs/:id", async (req, res) => {
    console.log('🔍 [DELETE CV] Request received:', {
      cvId: req.params.id,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      hasUser: !!req.user,
      sessionID: req.sessionID
    });

    if (!checkAuthentication(req, res)) {
      console.log('❌ [DELETE CV] Authentication failed');
      return;
    }

    try {
      const cvId = req.params.id; // String ID au lieu de number  
      console.log('✅ [DELETE CV] User authenticated, attempting to delete CV:', cvId);
      const cv = await storage.getCVById(cvId);
      
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this CV" });
      }

      await storage.deleteCV(cvId);
      return res.sendStatus(204);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Route to sync pending CV after login
  app.post('/api/sync-pending-cv', async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { cvData, templateId, templateType, mainColor, displaySettings, title } = req.body;
      
      // Create CV for the authenticated user
      const cv = await storage.createCV({
        userId: req.user.id,
        title: title || 'My Resume',
        type: templateType || 'digital',
        templateId,
        mainColor,
        data: JSON.stringify({
          cvData: cvData || {},
          displaySettings: displaySettings || {}
        }),
        subdomain: null
      });

      return res.json({ success: true, cv });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to sync pending CV' });
    }
  });

  // CV subdomain check
  app.get("/api/check-subdomain", async (req, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { subdomain } = req.query;
      if (!subdomain || typeof subdomain !== 'string') {
        return res.status(400).json({ message: "Subdomain is required" });
      }

      const cv = await storage.getCVBySubdomain(subdomain);
      return res.json({ available: !cv });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Password reset request
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email requis" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Ne pas révéler si l'email existe ou non pour la sécurité
        return res.json({ message: "Si cet email existe, vous recevrez un lien de réinitialisation" });
      }

      // Générer un token de réinitialisation
      const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 20)}`;
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      // Envoyer l'email de réinitialisation
      const { sendPasswordResetEmail } = await import('./email');
      await sendPasswordResetEmail(user.email!, resetToken);

      return res.json({ message: "Si cet email existe, vous recevrez un lien de réinitialisation" });
    } catch (error: any) {
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Password reset with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token et nouveau mot de passe requis" });
      }

      const { eq, and, gt } = await import('drizzle-orm');
      const { users } = await import('@shared/schema');
      const { db } = await import('./db');
      
      const [user] = await db.select().from(users).where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiry, new Date())
        )
      );

      if (!user) {
        return res.status(400).json({ message: "Token invalide ou expiré" });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      return res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error: any) {
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Test endpoint pour email de suppression
  app.post("/api/test-deletion-email", async (req, res) => {
    try {
      const { email, firstName } = req.body;
      
      const { sendAccountDeletionEmail } = await import('./email');
      const result = await sendAccountDeletionEmail(email, firstName);
      
      return res.json({ success: result, message: result ? 'Email envoyé' : 'Échec envoi' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Delete user account with deferred deletion  
  app.delete("/api/account", async (req, res) => {
    // Use consistent authentication check
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      // ÉTAPE 1: Récupérer les données utilisateur DIRECTEMENT de la base de données
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      
      // ÉTAPE 1.5: Cancel subscription if user has one
      let subscriptionCancelled = false;
      if (stripe && user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          subscriptionCancelled = true;
        } catch (stripeError: any) {
          // Continue with account deletion even if subscription cancellation fails
        }
      }

      // ÉTAPE 2: Envoyer l'email de confirmation AVANT toute suppression
      if (user.email) {
        try {
          const { sendAccountDeletionEmail } = await import('./email');
          
          // Use firstName or fallback to 'User' like in welcome email
          const firstName = user.firstName || 'User';
          
          await sendAccountDeletionEmail(user.email, firstName, subscriptionCancelled);
        } catch (emailError: any) {
          // Continue with deletion even if email fails
        }
      }
      
      // ÉTAPE 3: Créer l'enregistrement de suppression différée pour conservation email
      try {
        const deletedUserRecord = await storage.createDeletedUserRecord(user);
      } catch (recordError: any) {
      }

      // ÉTAPE 4: Attendre traitement email par Resend
      await new Promise(resolve => setTimeout(resolve, 7000));

      // ÉTAPE 5: Dépublier tous les CV de l'utilisateur et libérer les URLs
      try {
        const userCVs = await storage.getCVsByUserId(userId);
        for (const cv of userCVs) {
          if (cv.isPublished && cv.subdomain) {
            await storage.updateCV(cv.id, { 
              subdomain: null,
              isPublished: false,
              publishedAt: null
            });
          }
        }
      } catch (cvError: any) {
      }

      // ÉTAPE 6: Supprimer l'utilisateur de la base principale
      await storage.deleteUser(userId);

      // ÉTAPE 7: Déconnecter l'utilisateur
      req.logout((err) => {
        // Ignore logout errors
      });

      return res.json({ message: "Compte supprimé avec succès" });
    } catch (error: any) {
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Image proxy endpoint to bypass CORS issues for PDF generation
  app.get("/api/image-proxy", async (req, res) => {
    const imageUrl = req.query.url as string;
    const circular = req.query.circular === 'true';
    
    if (!imageUrl) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    try {
      console.log('🔍 [PROXY] Fetching image:', imageUrl, circular ? '(circular)' : '(square)');
      
      // Fetch the image from S3
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error('❌ [PROXY] Failed to fetch image:', response.status, response.statusText);
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      // Get the image data
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      let processedBuffer = Buffer.from(imageBuffer);
      
      // Apply circular mask if requested
      if (circular) {
        try {
          const sharp = require('sharp');
          
          // Get image metadata
          const metadata = await sharp(processedBuffer).metadata();
          console.log('🔍 [PROXY] Original image dimensions:', metadata.width, 'x', metadata.height);
          
          // Resize to square first (use the larger dimension)
          const maxSize = Math.max(metadata.width || 0, metadata.height || 0);
          const squareSize = Math.min(maxSize, 500); // Limit to 500px for performance
          
          console.log('🔍 [PROXY] Resizing to square:', squareSize, 'x', squareSize);
          
          // First resize to square
          const squareImage = await sharp(processedBuffer)
            .resize(squareSize, squareSize, { 
              fit: 'cover',
              position: 'center'
            })
            .png()
            .toBuffer();
          
          // Use Sharp's extract method to create a circular crop
          const radius = squareSize / 2;
          
          // Create a circular mask using Sharp's built-in capabilities
          // First, create a circular alpha channel
          const maskBuffer = await sharp({
            create: {
              width: squareSize,
              height: squareSize,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          })
          .composite([{
            input: Buffer.from(`
              <svg width="${squareSize}" height="${squareSize}">
                <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
              </svg>
            `),
            blend: 'dest-over'
          }])
          .png()
          .toBuffer();
          
          // Apply the mask to the image
          processedBuffer = await sharp(squareImage)
            .composite([{ 
              input: maskBuffer, 
              blend: 'dest-in' 
            }])
            .png()
            .toBuffer();
            
          console.log('✅ [PROXY] Circular mask applied to square image');
        } catch (sharpError) {
          console.error('❌ [PROXY] Sharp processing failed:', sharpError);
          // Fallback to original image if sharp fails
        }
      }
      
      // Set CORS headers to allow access from brevy.me
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': circular ? 'image/png' : contentType,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      console.log('✅ [PROXY] Image proxied successfully');
      res.send(processedBuffer);
      
    } catch (error) {
      console.error('❌ [PROXY] Error proxying image:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // File upload endpoint - avec support S3 et fallback local
  app.post("/api/upload-photo", upload.single('photo'), async (req: any, res) => {
    
    // Permettre l'upload sans authentification (pour faciliter l'usage)
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    
    if (!isAuthenticated) {
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier téléchargé" });
    }


    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'anonymous';
      let imageUrl: string;

      // Essayer d'uploader vers S3 en premier
      if (s3Service.isAvailable()) {
        try {
          imageUrl = await s3Service.uploadImage(
            req.file.buffer,
            req.file.originalname,
            userId
          );
          
          return res.json({ 
            filePath: imageUrl,
            storage: 's3',
            message: 'Image uploadée avec succès vers le cloud'
          });
        } catch (s3Error) {
          // Continuer avec le stockage local en cas d'échec S3
        }
      } else {
      }

      // Fallback vers stockage local
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = uniqueSuffix + ext;
      const filepath = path.join(uploadDir, filename);

      // Écrire le fichier en local
      fs.writeFileSync(filepath, req.file.buffer);
      
      const localPath = `/uploads/${filename}`;
      
      return res.json({ 
        filePath: localPath,
        storage: 'local',
        message: 'Image uploadée vers le stockage local'
      });
    } catch (error) {
      return res.status(500).json({ 
        message: "Erreur lors de l'upload de l'image",
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Endpoint pour supprimer les images (optionnel)
  app.delete("/api/delete-photo", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: "URL d'image manquante" });
    }

    try {
      // Si c'est une URL S3, utiliser le service S3
      if (s3Service.isAvailable() && imageUrl.includes('s3') || imageUrl.includes(process.env.S3_ENDPOINT || '')) {
        await s3Service.deleteImage(imageUrl);
        return res.json({ message: 'Image supprimée du cloud' });
      }

      // Si c'est un fichier local
      if (imageUrl.startsWith('/uploads/')) {
        const filename = imageUrl.replace('/uploads/', '');
        const filepath = path.join(__dirname, '../uploads', filename);
        
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          return res.json({ message: 'Image supprimée du stockage local' });
        }
      }

      return res.status(404).json({ message: 'Image non trouvée' });
    } catch (error) {
      return res.status(500).json({ 
        message: "Erreur lors de la suppression de l'image",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  // CV Sharing endpoints

  // Helper function to clean subdomain (remove accents and special characters)
  const cleanSubdomain = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]/g, '') // Garde seulement lettres et chiffres (pas de tirets)
      .trim();
  };

  // Check subdomain availability
  app.post("/api/check-subdomain", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { subdomain } = req.body;
      
      if (!subdomain) {
        return res.status(400).json({ message: "Subdomain is required" });
      }

      // Clean the subdomain
      const cleanedSubdomain = cleanSubdomain(subdomain);
      
      if (!cleanedSubdomain) {
        return res.json({ 
          available: false, 
          message: "Le sous-domaine doit contenir au moins une lettre ou un chiffre" 
        });
      }

      // Validate cleaned subdomain format
      if (cleanedSubdomain.length < 3 || cleanedSubdomain.length > 30) {
        return res.json({ 
          available: false, 
          message: "Le sous-domaine doit contenir entre 3 et 30 caractères" 
        });
      }

      // Check reserved subdomains
      const reserved = ['admin', 'www', 'api', 'app', 'test', 'demo', 'mail', 'email', 'support', 'help'];
      if (reserved.includes(cleanedSubdomain.toLowerCase())) {
        return res.json({ 
          available: false, 
          message: "Ce sous-domaine est réservé" 
        });
      }

      // Check if subdomain is already taken
      const existingCV = await storage.getCVBySubdomain(cleanedSubdomain);
      const available = !existingCV;

      return res.json({ 
        available, 
        cleanedSubdomain,
        message: available ? "Sous-domaine disponible" : "Ce sous-domaine n'est pas disponible" 
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Erreur lors de la vérification de disponibilité" });
    }
  });

  // Publish CV with custom subdomain
  app.post("/api/publish-cv-custom", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { cvId, language, subdomain } = req.body;
      
      if (!cvId || !subdomain) {
        return res.status(400).json({ message: "CV ID and subdomain are required" });
      }

      // Verify CV belongs to user
      const cv = await storage.getCVById(cvId);
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this CV" });
      }

      // Check if user already has a published CV
      const existingUserCV = await storage.getUserCVWithSubdomain(req.user.id);
      if (existingUserCV && existingUserCV.id !== cvId) {
        return res.status(400).json({ 
          message: "You already have a published CV. You can only have one publication address.",
          existingCVTitle: existingUserCV.title,
          existingSubdomain: existingUserCV.subdomain
        });
      }

      // Clean and validate subdomain
      const cleanedSubdomain = cleanSubdomain(subdomain);
      if (!cleanedSubdomain) {
        return res.status(400).json({ message: "Invalid subdomain format" });
      }

      // Check if subdomain is available
      const existingCV = await storage.getCVBySubdomain(cleanedSubdomain);
      if (existingCV && existingCV.id !== cvId) {
        return res.status(400).json({ message: "This subdomain is already taken" });
      }

      // Remove subdomain from any other CV of this user
      if (existingUserCV && existingUserCV.id !== cvId) {
        await storage.updateCV(existingUserCV.id, { subdomain: null });
      }

      // Update CV with custom subdomain, publish status, and language
      const updatedCV = await storage.updateCV(cvId, { 
        subdomain: cleanedSubdomain,
        isPublished: true,
        publishedAt: new Date(),
        publishedLanguage: language || req.user.language || 'en'
      });

      const isProd = process.env.NODE_ENV === 'production' || process.env.FRONT_ORIGIN;
      const baseUrl = isProd ? 'https://brevy.me' : 'http://localhost:10000';
      
      return res.json({
        message: `CV published successfully! Your resume is now available at ${baseUrl}/cv/${cleanedSubdomain}`,
        subdomain: cleanedSubdomain,
        shareUrl: `${baseUrl}/cv/${cleanedSubdomain}`,
        url: `${baseUrl}/cv/${cleanedSubdomain}`
      });

    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Publish CV with subdomain generation
  app.post("/api/publish-cv", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { cvId, language } = req.body;
      
      if (!cvId) {
        return res.status(400).json({ message: "CV ID is required" });
      }

      // Verify CV belongs to user
      const cv = await storage.getCVById(cvId);
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this CV" });
      }

      // Check if user already has a published CV
      const existingUserCV = await storage.getUserCVWithSubdomain(req.user.id);
      if (existingUserCV && existingUserCV.id !== cvId) {
        return res.status(400).json({ 
          message: "You already have a published CV. You can only have one publication address.",
          existingCVTitle: existingUserCV.title,
          existingSubdomain: existingUserCV.subdomain
        });
      }

      // Generate subdomain with fallback logic
      const user = await storage.getUser(req.user.id);
      let firstName = '';
      let lastName = '';
      
      // Priority 1: User profile firstName/lastName (Google OAuth or manual entry)
      if (user?.firstName && user?.lastName) {
        firstName = user.firstName;
        lastName = user.lastName;
      } else {
        // Priority 2: Extract from CV data
        const cv = await storage.getCVById(cvId);
        if (cv?.cvData?.firstName && cv?.cvData?.lastName) {
          firstName = cv.cvData.firstName;
          lastName = cv.cvData.lastName;
        } else if (user?.email) {
          // Priority 3: Extract from email (text before @)
          const emailPrefix = user.email.split('@')[0];
          const nameParts = emailPrefix.split(/[._-]/);
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join('');
          } else {
            firstName = emailPrefix;
            lastName = '';
          }
        }
      }
      
      if (!firstName) {
        return res.status(400).json({ message: "Impossible de générer un sous-domaine. Veuillez remplir vos informations personnelles dans le CV." });
      }

      const baseSubdomain = cleanSubdomain(`${firstName}${lastName}`);
      
      if (!baseSubdomain) {
        return res.status(400).json({ message: "Impossible de générer un sous-domaine à partir de vos informations" });
      }

      // Find available subdomain with auto-increment
      let finalSubdomain = baseSubdomain;
      let counter = 1;
      let hasConflict = false;
      
      while (true) {
        const existingCV = await storage.getCVBySubdomain(finalSubdomain);
        
        // If no existing CV or it's the same CV we're updating, use this subdomain
        if (!existingCV || existingCV.id === cvId) {
          break;
        }
        
        // Mark that we have a conflict with the base subdomain
        if (counter === 1) {
          hasConflict = true;
        }
        
        // Increment counter and try next subdomain
        counter++;
        finalSubdomain = `${baseSubdomain}-${counter}`;
        
        // Safety check to avoid infinite loop
        if (counter > 100) {
          return res.status(400).json({ message: "Impossible de trouver un sous-domaine disponible" });
        }
      }
      
      // If there was a conflict with the base subdomain, return conflict info
      if (hasConflict) {
        return res.status(409).json({ 
          message: "Ce nom d'utilisateur existe déjà",
          conflict: true,
          suggestedSubdomain: finalSubdomain,
          baseSubdomain: baseSubdomain
        });
      }

      // Remove subdomain from any other CV of this user
      if (existingUserCV && existingUserCV.id !== cvId) {
        await storage.updateCV(existingUserCV.id, { subdomain: null });
      }

      // Update CV with final subdomain, publish status, and language
      const updatedCV = await storage.updateCV(cvId, { 
        subdomain: finalSubdomain,
        isPublished: true,
        publishedAt: new Date(),
        publishedLanguage: language || req.user.language || 'en'
      });
      
      const isProd = process.env.NODE_ENV === 'production' || process.env.FRONT_ORIGIN;
      const baseUrl = isProd ? 'https://brevy.me' : 'http://localhost:10000';
      
      return res.json({ 
        success: true, 
        subdomain: finalSubdomain,
        shareUrl: `${baseUrl}/cv/${finalSubdomain}`,
        isPublished: true,
        publishedAt: updatedCV.publishedAt,
        message: counter > 1 
          ? `CV publié avec succès ! Lien : ${baseUrl}/cv/${finalSubdomain}`
          : `CV publié avec succès ! Lien : ${baseUrl}/cv/${finalSubdomain}`
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Erreur lors de la publication du CV" });
    }
  });

  // Unpublish CV
  app.post("/api/unpublish-cv", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { cvId } = req.body;
      
      if (!cvId) {
        return res.status(400).json({ message: "CV ID is required" });
      }

      // Verify CV belongs to user
      const cv = await storage.getCVById(cvId);
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this CV" });
      }

      // Update CV to unpublish - This frees up the subdomain for reuse
      const updatedCV = await storage.updateCV(cvId, { 
        subdomain: null,
        isPublished: false,
        publishedAt: null
      });
      
      return res.json({ 
        success: true,
        isPublished: false,
        message: "CV unpublished successfully"
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Error unpublishing CV" });
    }
  });

  // Update CV publication language
  app.post("/api/update-cv-language", async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      const { cvId, language } = req.body;
      
      if (!cvId) {
        return res.status(400).json({ message: "CV ID is required" });
      }

      if (!language) {
        return res.status(400).json({ message: "Language is required" });
      }

      // Verify CV belongs to user
      const cv = await storage.getCVById(cvId);
      if (!cv) {
        return res.status(404).json({ message: "CV not found" });
      }

      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this CV" });
      }

      // Update CV language
      await storage.updateCV(cvId, { 
        publishedLanguage: language
      });
      
      return res.json({ 
        success: true,
        publishedLanguage: language,
        message: "CV language updated successfully"
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Error updating CV language" });
    }
  });

  // Temporary route to add published_language column
  app.get("/api/add-published-language-column", async (req: any, res) => {
    try {
      console.log('🔧 Adding published_language column to cvs table...');
      
      // Check if column already exists
      const checkColumn = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cvs' AND column_name = 'published_language'
      `);
      
      if (checkColumn.rows.length === 0) {
        console.log('➕ Adding published_language column...');
        await db.execute(`
          ALTER TABLE cvs 
          ADD COLUMN published_language VARCHAR DEFAULT 'en'
        `);
        console.log('✅ Column published_language added successfully');
      } else {
        console.log('✅ Column published_language already exists');
      }
      
      console.log('🎉 Database schema updated successfully!');
      return res.json({
        success: true,
        message: 'Column published_language added successfully',
        columnExists: checkColumn.rows.length > 0
      });
    } catch (error) {
      console.error('❌ Error updating database schema:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Alternative route for database migration
  app.get("/api/fix-db", async (req: any, res) => {
    try {
      console.log('🔧 Adding published_language column to cvs table...');
      
      // Check if column already exists
      const checkColumn = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cvs' AND column_name = 'published_language'
      `);
      
      if (checkColumn.rows.length === 0) {
        console.log('➕ Adding published_language column...');
        await db.execute(`
          ALTER TABLE cvs 
          ADD COLUMN published_language VARCHAR DEFAULT 'en'
        `);
        console.log('✅ Column published_language added successfully');
      } else {
        console.log('✅ Column published_language already exists');
      }
      
      console.log('🎉 Database schema updated successfully!');
      return res.json({
        success: true,
        message: 'Column published_language added successfully',
        columnExists: checkColumn.rows.length > 0
      });
    } catch (error) {
      console.error('❌ Error updating database schema:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Public route to view a CV by subdomain (API endpoint)
  app.get("/api/view-cv/:subdomain", async (req, res) => {
    try {
      // Optimisation : cache headers pour améliorer les performances
      res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
      
      const cv = await storage.getCVBySubdomain(req.params.subdomain);
      if (!cv || !cv.isPublished) {
        return res.status(404).json({ message: "CV not found or not published" });
      }

      // Get user info for the CV (optimisé : seulement les champs nécessaires)
      const user = await storage.getUser(cv.userId);
      
      return res.json({
        ...cv,
        publishedLanguage: cv.publishedLanguage || 'en', // Include the published language
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          // Do NOT expose user profileImageUrl - only CV-specific photos should be shown
          hasActiveSubscription: user.hasActiveSubscription || false
        } : null
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Development route to simulate subdomain access
  app.get("/dev/:subdomain", async (req, res) => {
    try {
      const cv = await storage.getCVBySubdomain(req.params.subdomain);
      if (!cv || !cv.isPublished) {
        return res.redirect('/cv/not-found');
      }

      // Redirect to the CV page
      res.redirect(`/cv/${req.params.subdomain}`);
    } catch (error: any) {
      res.redirect('/cv/not-found');
    }
  });

  // DNS test endpoint for debugging wildcard propagation
  app.get("/api/dns-test", async (req, res) => {
    const host = req.get('host') || '';
    const userAgent = req.get('user-agent') || '';
    const forwarded = req.get('x-forwarded-host') || '';
    const originalHost = req.get('x-original-host') || '';
    const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
    
    return res.json({
      success: true,
      message: "🎉 DNS wildcard + SSL working perfectly!",
      ssl_status: isSecure ? "✅ HTTPS Active" : "⚠️ HTTP Only",
      cloudflare_active: req.get('cf-ray') ? "✅ Cloudflare Proxy Active" : "❌ Direct Connection",
      host: host,
      subdomain: host.split('.')[0],
      headers: {
        'x-forwarded-host': forwarded,
        'x-original-host': originalHost,
        'cf-ray': req.get('cf-ray'),
        'user-agent': userAgent
      },
      timestamp: new Date().toISOString()
    });
  });



  // Secure CV preview endpoint - serves HTML with anti-copy protections
  app.post("/api/cv-preview", (req, res) => {
    try {
      // Get CV data and template info from request
      let { cvData, templateType, templateId, mainColor, currentPage = 1 } = req.body;
      
      // Add security headers while allowing proper iframe loading
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Check if cvData is a string and attempt to parse it
      if (typeof cvData === 'string') {
        try {
          cvData = JSON.parse(cvData);
        } catch (e) {
          return res.status(400).send("Invalid JSON in cvData parameter");
        }
      }
      
      // Safety checks for required fields
      if (!cvData || !templateType) {
        return res.status(400).send("Missing required parameters");
      }

      // Check for premium access (to be implemented with Stripe later)
      const isPremium = false; // This will be set based on user subscription status
      
      // Initialize empty arrays for safety if they don't exist
      cvData.experience = cvData.experience || [];
      cvData.education = cvData.education || [];
      cvData.skills = cvData.skills || [];
      cvData.languages = cvData.languages || [];
      cvData.personalInfo = cvData.personalInfo || {};
      
      // Import helper functions for template rendering
      const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date);
      };
      
      const formatDateRange = (startDate: string | undefined, endDate: string | undefined): string => {
        const start = startDate ? formatDate(startDate) : '';
        const end = endDate ? formatDate(endDate) : 'Present';
        return start && end ? `${start} - ${end}` : '';
      };

      // Format experiences for rendering
      const experiencesHTML = cvData.experience.map((exp: any) => `
        <div class="experience-item">
          <div class="position-header">
            <span class="company">${exp.company || ''} ${exp.location ? `- ${exp.location}` : ''}</span>
            <span class="duration">${formatDateRange(exp.startDate, exp.endDate)}</span>
          </div>
          <span class="position">${exp.position || ''}</span>
          <ul>
            ${exp.description ? `<li>${exp.description}</li>` : ''}
          </ul>
        </div>
      `).join('');

      // Format education for rendering
      const educationHTML = cvData.education.map((edu: any) => `
        <div class="education-item">
          <div class="school">
            <span class="location">${edu.school || ''} ${edu.location ? `- ${edu.location}` : ''}</span>
            <span class="duration">${formatDateRange(edu.startDate, edu.endDate)}</span>
          </div>
          <span class="diploma">${edu.degree || ''}</span>
          <ul>
            ${edu.description ? `<li>${edu.description}</li>` : ''}
          </ul>
        </div>
      `).join('');

      // Format skills for rendering
      const skillsHTML = cvData.skills.map((skill: any) => `
        <li>
          <div class="skill_name">
            <p>${skill.name || ''}</p>
          </div>
          <div class="skill_progress">
            <span style="width: ${(Number(skill.level) || 0) * 20}%;"></span>
          </div>
        </li>
      `).join('');

      // Format languages for rendering
      const languagesHTML = cvData.languages.map((lang: any) => `
        <li class="lang">${lang.name || ''} | ${lang.level || ''}</li>
      `).join('');
      
      // Create HTML content based on template type
      let htmlContent = '';
      
      if (templateType === 'A4') {
        // A4 Template with pagination - modern docx-style template
        htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV Preview</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --primary-color: ${mainColor || '#0048c2'};
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: transparent;
      color: #333;
      line-height: 1.5;
      /* A4 dimensions for printing */
      width: 595px;
      height: 842px;
      margin: 0 auto;
      overflow: hidden;
      position: relative;
    }
    
    /* CV-specific styles */
    .cv-container {
      padding: 40px;
      height: 100%;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .profile-img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--primary-color);
    }
    
    .contact-info {
      margin-top: 10px;
    }
    
    .name {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 5px;
    }
    
    .title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 15px;
    }
    
    .summary {
      margin-bottom: 25px;
      line-height: 1.5;
    }
    
    .section-title {
      color: var(--primary-color);
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 5px;
    }
    
    .experience-item, .education-item {
      margin-bottom: 20px;
    }
    
    .position-header, .school {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .company, .location {
      font-weight: 600;
    }
    
    .position, .diploma {
      display: block;
      font-style: italic;
      margin-bottom: 5px;
    }
    
    ul {
      padding-left: 20px;
    }
    
    .skills-list, .languages-list {
      list-style: none;
      padding: 0;
    }
    
    .skill_name {
      margin-bottom: 5px;
    }
    
    .skill_progress {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .skill_progress span {
      display: block;
      height: 100%;
      background: var(--primary-color);
      border-radius: 4px;
    }
    
    .languages-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .lang {
      background: #f4f4f4;
      padding: 5px 10px;
      border-radius: 4px;
    }
    
    /* Animation for page transitions */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Page-specific styles */
    .page {
      display: none;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    .page.active {
      display: block;
    }
    
    /* Anti-copy protection styles */
    body {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: none !important;
    }
    
    /* Allow pointer events only inside controls */
    .page-controls {
      pointer-events: all !important;
    }
    
    /* CSS content scrambling */
    .section-title:before, h1:before, h2:before, .experience-item:before {
      content: "";
      display: none;
    }
    
    /* Overlay to prevent inspector manipulation */
    #anti-inspector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      background: transparent;
      pointer-events: none;
    }
    
    /* Watermark pattern for premium tease */
    body:after {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: repeating-linear-gradient(
        45deg,
        rgba(150, 150, 150, 0.02),
        rgba(150, 150, 150, 0.02) 10px,
        rgba(150, 150, 150, 0.01) 10px,
        rgba(150, 150, 150, 0.01) 20px
      );
      pointer-events: none;
      z-index: 9900;
    }
    
    /* Pro upgrade message */
    .cv-container:after {
      content: "Pro Upgrade Required for Export and Editing";
      position: fixed;
      bottom: 10px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: rgba(100, 100, 100, 0.7);
      letter-spacing: 0.5px;
      transform: rotate(-0.5deg);
      pointer-events: none;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <!-- Page 1 -->
  <div id="page1" class="page ${currentPage === 1 ? 'active' : ''}">
    <div class="cv-container">
      <div class="header">
        <div>
          <h1 class="name">${cvData.personalInfo.firstName || ''} ${cvData.personalInfo.lastName || ''}</h1>
          <h2 class="title">${cvData.personalInfo.title || ''}</h2>
          <div class="contact-info">
            <p>${cvData.personalInfo.email || ''}</p>
            <p>${cvData.personalInfo.phone || ''}</p>
            <p>${cvData.personalInfo.location || ''}</p>
          </div>
        </div>
        ${cvData.personalInfo.photoUrl ? `<img src="${cvData.personalInfo.photoUrl}" alt="Profile photo" class="profile-img" />` : ''}
      </div>
      
      <div class="summary">
        <p>${cvData.summary || ''}</p>
      </div>
      
      <div class="experience">
        <h3 class="section-title">Experience</h3>
        ${experiencesHTML}
      </div>
    </div>
  </div>
  
  <!-- Page 2 -->
  <div id="page2" class="page ${currentPage === 2 ? 'active' : ''}">
    <div class="cv-container">
      <div class="education">
        <h3 class="section-title">Education</h3>
        ${educationHTML}
      </div>
      
      <div class="skills">
        <h3 class="section-title">Skills</h3>
        <ul class="skills-list">
          ${skillsHTML}
        </ul>
      </div>
      
      <div class="languages">
        <h3 class="section-title">Languages</h3>
        <ul class="languages-list">
          ${languagesHTML}
        </ul>
      </div>
    </div>
  </div>
  
  <script>
    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Prevent keyboard shortcuts for copying
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    });
    
    // Page navigation
    window.addEventListener('message', function(event) {
      if (event.data.type === 'changePage') {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById('page' + event.data.page)?.classList.add('active');
      }
    });
    
    // Simple premium indicator
    (function() {
      // Ajouter un watermark discret
      const watermark = document.createElement('div');
      watermark.id = 'premium-watermark';
      watermark.style.position = 'fixed';
      watermark.style.bottom = '8px';
      watermark.style.right = '8px';
      watermark.style.fontSize = '10px';
      watermark.style.color = 'rgba(0,0,0,0.3)';
      watermark.style.zIndex = '9999';
      watermark.style.pointerEvents = 'none';
      watermark.innerHTML = 'Aperçu uniquement - Version Pro requise pour exporter';
      document.body.appendChild(watermark);
      
      // Premium subscription suggestion handled via UI
    })();
  </script>
</body>
</html>`;
      } else if (templateType === 'digital') {
        // Digital Template - responsive single page design
        htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Digital CV Preview</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --primary-color: ${mainColor || '#0048c2'};
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: transparent;
      color: #333;
      line-height: 1.5;
    }
    
    .cv-container {
      max-width: 430px;
      width: 100%;
      background-color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    
    header {
      background-color: var(--primary-color);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .profile-img-container {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      margin: 0 auto 1rem;
      border: 3px solid white;
    }
    
    .profile-img-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }
    
    h2 {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    
    .contact-info {
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    
    .contact-info p {
      margin-bottom: 0.3rem;
    }
    
    .content {
      padding: 1.5rem;
    }
    
    .section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      color: var(--primary-color);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--primary-color);
    }
    
    .experience-item, .education-item {
      margin-bottom: 1.5rem;
    }
    
    .job-title, .degree {
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    
    .company, .school {
      font-weight: 500;
      margin-bottom: 0.3rem;
    }
    
    .duration {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .description {
      margin-top: 0.5rem;
      font-size: 0.95rem;
    }
    
    .skills-list, .languages-list {
      list-style: none;
    }
    
    .skills-list li, .languages-list li {
      margin-bottom: 0.7rem;
    }
    
    .skill-name {
      display: block;
      margin-bottom: 0.3rem;
    }
    
    .skill-bar {
      height: 8px;
      background-color: #eee;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .skill-level {
      height: 100%;
      background-color: var(--primary-color);
    }
    
    .language {
      background-color: #f5f5f5;
      padding: 0.4rem 0.8rem;
      border-radius: 30px;
      display: inline-block;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    /* Anti-copy protection styles */
    body {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: none !important;
    }
    
    /* CSS content scrambling */
    .section-title:before, h1:before, h2:before, .experience-item:before {
      content: "";
      display: none;
    }
    
    /* Overlay to prevent inspector manipulation */
    #anti-inspector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      background: transparent;
      pointer-events: none;
    }
    
    /* Watermark pattern for premium tease */
    body:after {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: repeating-linear-gradient(
        45deg,
        rgba(150, 150, 150, 0.02),
        rgba(150, 150, 150, 0.02) 10px,
        rgba(150, 150, 150, 0.01) 10px,
        rgba(150, 150, 150, 0.01) 20px
      );
      pointer-events: none;
      z-index: 9900;
    }
    
    /* Pro upgrade message */
    .cv-container:after {
      content: "Pro Upgrade Required for Export and Editing";
      position: fixed;
      bottom: 10px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: rgba(100, 100, 100, 0.7);
      letter-spacing: 0.5px;
      transform: rotate(-0.5deg);
      pointer-events: none;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <header>
      ${cvData.personalInfo.photoUrl ? 
        `<div class="profile-img-container">
          <img src="${cvData.personalInfo.photoUrl}" alt="Profile photo" />
        </div>` : ''}
      <h1>${cvData.personalInfo.firstName || ''} ${cvData.personalInfo.lastName || ''}</h1>
      <h2>${cvData.personalInfo.title || ''}</h2>
      <div class="contact-info">
        <p>${cvData.personalInfo.email || ''}</p>
        <p>${cvData.personalInfo.phone || ''}</p>
        <p>${cvData.personalInfo.location || ''}</p>
      </div>
    </header>
    
    <div class="content">
      <div class="section">
        <p>${cvData.summary || ''}</p>
      </div>
      
      <div class="section">
        <h3 class="section-title">Experience</h3>
        ${cvData.experience.map((exp: any) => `
          <div class="experience-item">
            <div class="job-title">${exp.position || ''}</div>
            <div class="company">${exp.company || ''} ${exp.location ? `- ${exp.location}` : ''}</div>
            <div class="duration">${formatDateRange(exp.startDate, exp.endDate)}</div>
            <div class="description">${exp.description || ''}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h3 class="section-title">Education</h3>
        ${cvData.education.map((edu: any) => `
          <div class="education-item">
            <div class="degree">${edu.degree || ''}</div>
            <div class="school">${edu.school || ''} ${edu.location ? `- ${edu.location}` : ''}</div>
            <div class="duration">${formatDateRange(edu.startDate, edu.endDate)}</div>
            <div class="description">${edu.description || ''}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h3 class="section-title">Skills</h3>
        <ul class="skills-list">
          ${cvData.skills.map((skill: any) => `
            <li>
              <span class="skill-name">${skill.name || ''}</span>
              <div class="skill-bar">
                <div class="skill-level" style="width: ${(Number(skill.level) || 0) * 20}%;"></div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h3 class="section-title">Languages</h3>
        <div class="languages-list">
          ${cvData.languages.map((lang: any) => `
            <span class="language">${lang.name || ''} - ${lang.level || ''}</span>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Prevent keyboard shortcuts for copying
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    });
    
    // Simple premium indicator
    (function() {
      // Ajouter un watermark discret
      const watermark = document.createElement('div');
      watermark.id = 'premium-watermark';
      watermark.style.position = 'fixed';
      watermark.style.bottom = '8px';
      watermark.style.right = '8px';
      watermark.style.fontSize = '10px';
      watermark.style.color = 'rgba(0,0,0,0.3)';
      watermark.style.zIndex = '9999';
      watermark.style.pointerEvents = 'none';
      watermark.innerHTML = 'Aperçu uniquement - Version Pro requise pour exporter';
      document.body.appendChild(watermark);
      
      // Premium subscription suggestion handled via UI
    })();
  </script>
</body>
</html>`;
      }
      
      // Set the correct content type and comprehensive security headers
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Prevent embedding in unauthorized iframes
      res.setHeader('Content-Security-Policy', "default-src 'self'; img-src * data:; style-src 'unsafe-inline' 'self'; script-src 'unsafe-inline' 'self';");
      res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME type sniffing
      res.setHeader('Referrer-Policy', 'same-origin'); // Restrict referrer information
      res.setHeader('Permissions-Policy', 'clipboard-write=()'); // Prevent clipboard operations
      res.setHeader('Cache-Control', 'no-store, max-age=0'); // Prevent caching
      return res.send(htmlContent);
    } catch (error: any) {
      return res.status(500).send(`Error generating CV preview: ${error.message}`);
    }
  });

  // Webhook handler moved to server/index.ts before express.json() middleware

  // Stripe subscription routes
  app.post('/api/create-subscription', async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      let user = req.user;
      const { draftId } = req.body; // Extract draftId from request body


      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          // Return existing active subscription - no payment needed for active subscription
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: null, // No payment needed for active subscription
            status: subscription.status
          });
        }
      }

      if (!user.email) {
        return res.status(400).json({ message: 'User email is required for subscription' });
      }

      // Create or retrieve Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
        // Ensure customer has userId in metadata (for existing customers)
        if (!customer.deleted && !customer.metadata?.userId) {
          customer = await stripe.customers.update(customer.id, {
            metadata: {
              userId: user.id
            }
          });
        }
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: user.id
          }
        });
        
        // Update user with customer ID
        console.log('🔍 [SUBSCRIPTION] Updating user with Stripe customer ID:', customer.id);
        user = await storage.updateStripeCustomerId(user.id, customer.id);
        console.log('✅ [SUBSCRIPTION] User updated with customer ID:', user.stripeCustomerId);
      }

      // Use the configured Stripe price ID
      if (!process.env.STRIPE_PRICE_ID) {
        console.log('❌ [SUBSCRIPTION] Stripe price ID not configured');
        return res.status(500).json({ message: 'Stripe price ID not configured' });
      }
      
      console.log('🔍 [SUBSCRIPTION] Using Stripe price ID:', process.env.STRIPE_PRICE_ID);

      // Create subscription with payment intent and draftId metadata
      const subscriptionMetadata: { [key: string]: string } = {
        userId: user.id
      };
      if (draftId) {
        subscriptionMetadata.draftId = draftId;
      }

      console.log('🔍 [SUBSCRIPTION] Creating subscription for customer:', customer.id);
      
      let subscription;
      try {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: process.env.STRIPE_PRICE_ID
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: {
            save_default_payment_method: 'on_subscription'
          },
          expand: ['latest_invoice.payment_intent'],
          metadata: subscriptionMetadata
        });
        
        console.log('✅ [SUBSCRIPTION] Subscription created:', subscription.id);
      } catch (stripeError) {
        console.error('❌ [SUBSCRIPTION] Error creating subscription:', stripeError);
        return res.status(500).json({ 
          message: 'Failed to create subscription',
          error: stripeError.message 
        });
      }

      // Update user with subscription info but DON'T activate subscription until payment is confirmed
      await storage.updateStripeCustomerId(user.id, customer.id);
      
      // Store subscription ID but don't set hasActiveSubscription=true until payment confirmed via webhook
      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);
      

      // Get payment intent from latest invoice
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (latestInvoice as any).payment_intent as Stripe.PaymentIntent;
      
      return res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
        draftId: draftId // Return draftId for frontend use
      });

    } catch (error: any) {
      return res.status(400).json({ 
        message: 'Error creating subscription',
        error: error.message 
      });
    }
  });

  // Unsubscribe from premium subscription (cancel at period end to keep access until renewal)
  app.post('/api/unsubscribe', async (req: any, res) => {
    console.log('🔍 [UNSUBSCRIBE] Request received');
    console.log('🔍 [UNSUBSCRIBE] Session ID:', req.sessionID);
    console.log('🔍 [UNSUBSCRIBE] Is authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
    console.log('🔍 [UNSUBSCRIBE] User:', req.user ? req.user.id : 'No user');
    
    if (!checkAuthentication(req, res)) {
      return;
    }

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const user = req.user;

      // Ensure we have a subscription ID; if not, try to fetch the active one for this customer
      let subscriptionId: string | null = user.stripeSubscriptionId || null;
      if (!subscriptionId) {
        if (!user.stripeCustomerId) {
          return res.status(400).json({ error: "No Stripe customer linked to account" });
        }
        const activeSubs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1,
        });
        if (activeSubs.data.length === 0) {
          return res.status(400).json({ error: "No active subscription found" });
        }
        subscriptionId = activeSubs.data[0].id;
      }

      // Schedule cancellation at period end (keeps Premium active until then)
      const scheduled = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        // optional: add a reason in metadata
        metadata: { cancellation_source: 'user_request' },
      });

      // IMPORTANT: Do NOT set hasActiveSubscription=false now. Keep access until end.
      // We rely on the webhook customer.subscription.deleted to flip the flag on the end date.
      const updatedUser = await storage.updateUserStripeInfo(user.id, user.stripeCustomerId, subscriptionId);

      // Sync session user minimally (no change to hasActiveSubscription)
      try {
        req.user = { ...(req.user || {}), ...updatedUser };
        if (typeof req.login === 'function') {
          await new Promise<void>((resolve, reject) => {
            req.login(req.user, (err: any) => (err ? reject(err) : resolve()));
          });
        }
        if (req.session && typeof req.session.save === 'function') {
          await new Promise<void>((resolve) => req.session.save(() => resolve()));
        }
      } catch (sessErr) {
        console.error('⚠️ [UNSUBSCRIBE] Failed to sync session after scheduling cancel:', sessErr);
      }

      // Send cancellation confirmation email
      if (user.email && user.firstName) {
        try {
          const { sendSubscriptionCancellationEmail } = await import('./email');
          const subscriptionEndDate = new Date((scheduled as any).current_period_end * 1000);
          
          await sendSubscriptionCancellationEmail(user.email, user.firstName, subscriptionEndDate);
        } catch (emailError: any) {
        }
      }
      
      return res.json({ 
        message: "Subscription will be cancelled at period end",
        cancelAt: new Date((scheduled as any).current_period_end * 1000)
      });

    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      return res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Stripe webhook to handle subscription events
  const handleStripeWebhook = async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe) {
      return res.status(500).send('Stripe not configured');
    }

    if (!webhookSecret) {
      return res.status(500).send('Webhook secret not configured');
    }

    // Use req.body directly since express.raw middleware puts raw body there
    const rawBody = req.body;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          
          if (session.customer) {
            let userId: string | null = null;
            
            
            // Find user by customer ID - try metadata first
            const customerObj = await stripe.customers.retrieve(session.customer as string);
            
            if (customerObj && !customerObj.deleted) {
              if (customerObj.metadata?.userId) {
                userId = customerObj.metadata.userId;
              } else {
                // FALLBACK: Try to find user by email if metadata is missing
                if (customerObj.email) {
                  const userByEmail = await storage.getUserByEmail(customerObj.email);
                  if (userByEmail) {
                    userId = userByEmail.id;
                    
                    // Update customer metadata for future use
                    await stripe.customers.update(session.customer as string, {
                      metadata: { userId: userId }
                    });
                  } else {
                  }
                } else {
                }
              }
              
              if (userId) {
                // Immediately activate Premium status
                
                try {
                  const updatedUser = await storage.updateSubscriptionStatus(userId, true);
                } catch (updateError) {
                  console.error(`❌ [WEBHOOK] Failed to update subscription status for user ${userId}:`, updateError);
                  throw updateError;
                }
              } else {
              }
              
              // Get subscription to access metadata including draftId
              if (session.subscription) {
                try {
                  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

                  
                  // Handle draft conversion if present in subscription metadata
                  if (subscription.metadata?.draftId) {

                    
                    try {
                      // Find the draft
                      const drafts = await db.select().from(cvDrafts).where(eq(cvDrafts.id, subscription.metadata.draftId)).limit(1);
                      if (drafts.length > 0) {
                        const draft = drafts[0];
                        
                        // Claim the draft first
                        await db.update(cvDrafts)
                          .set({ 
                            userId: userId,
                            status: 'claimed' as any
                          })
                          .where(eq(cvDrafts.id, subscription.metadata.draftId));
                          
                        
                        // Convert draft to CV
                        if (draft && userId) {
                          const cvPayload = {
                            userId: userId,
                            title: (draft.payload as any)?.title || `${!customerObj.deleted ? customerObj.name || 'My' : 'My'} CV`,
                            type: (draft.payload as any)?.templateType || 'digital',
                            templateId: (draft.payload as any)?.templateId || 'template-classic',
                            mainColor: (draft.payload as any)?.mainColor || '#0076d1',
                            data: JSON.stringify({
                              cvData: (draft.payload as any)?.cvData || {},
                              displaySettings: (draft.payload as any)?.displaySettings || {}
                            }),
                            subdomain: null,
                            isPremiumLocked: false, // User now has premium subscription
                            requiresPremium: false
                          };
                        
                          const newCV = await storage.createCV(cvPayload);
    
                        
                          // Mark draft as converted
                          await db.update(cvDrafts)
                            .set({ status: 'converted' as any })
                            .where(eq(cvDrafts.id, subscription.metadata.draftId));
                        }
                      } else {
                        console.error(`❌ [STRIPE] Draft ${subscription.metadata.draftId} not found for conversion`);
                      }
                    } catch (error) {
                      console.error(`❌ [STRIPE] Error handling subscription metadata:`, error);
                    }
                  }
                } catch (error) {
                  console.error(`❌ [STRIPE] Error handling subscription metadata:`, error);
                }
              } else {
                console.error(`❌ [WEBHOOK] Could not find user for customer ${session.customer} - neither metadata nor email fallback worked`);
              }
            } else {
              console.error(`❌ [WEBHOOK] Customer ${session.customer} not found or deleted`);
            }
          } else {
            console.error(`❌ [WEBHOOK] No customer ID in checkout session ${session.id}`);
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const invoiceSubscription = (invoice as any).subscription;
          const subscriptionId = typeof invoiceSubscription === 'string' 
            ? invoiceSubscription 
            : invoiceSubscription?.id;
          const customerId = invoice.customer as string;


          if (subscriptionId) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Find user by customer ID - try direct lookup first, then fallback
            let user = await storage.getUserByStripeCustomerId(customerId);
            
            if (!user) {
              // FALLBACK: Try to find user by email if direct lookup fails
              const customerObj = await stripe.customers.retrieve(customerId);
              if (customerObj && !customerObj.deleted && customerObj.email) {
                const userByEmail = await storage.getUserByEmail(customerObj.email);
                if (userByEmail) {
                  user = userByEmail;
                  
                  // Update user's stripe customer ID for future use
                  await storage.updateStripeCustomerId(user.id, customerId);
                }
              }
            }
            
            if (user) {
              // Activate subscription for user
              await storage.updateSubscriptionStatus(user.id, true);
              
              // CRITICAL FIX: Convert draft to CV if draftId exists in subscription metadata
              const draftId = subscription.metadata?.draftId;
              if (draftId) {
                try {
                  // Find the draft
                  const drafts = await db.select().from(cvDrafts).where(eq(cvDrafts.id, draftId)).limit(1);
                  if (drafts.length > 0) {
                    const draft = drafts[0];
                    
                    // Check if draft is not expired
                    if (draft && new Date() <= draft.expiresAt) {
                      
                      // Convert draft to CV using existing storage method
                      if (draft) {
                        const cvPayload = {
                          title: (draft.payload as any)?.title || `${user.firstName || 'My'} CV`,
                          templateId: (draft.payload as any)?.templateId || 'template-classic',
                          templateType: (draft.payload as any)?.templateType || 'digital',
                          mainColor: (draft.payload as any)?.mainColor || '#0076d1',
                          cvData: (draft.payload as any)?.cvData || {},
                          displaySettings: (draft.payload as any)?.displaySettings || {}
                        };
                      
                        const newCV = await storage.createCV({
                          userId: user.id,
                          title: cvPayload.title || 'My CV',
                          type: cvPayload.templateType || 'digital',
                          templateId: cvPayload.templateId || 'template-classic',
                          mainColor: cvPayload.mainColor || '#0076d1',
                          data: JSON.stringify({
                            cvData: cvPayload.cvData || {},
                            displaySettings: cvPayload.displaySettings || {}
                          }),
                          subdomain: null
                        });
                        
                        // Clean up: delete the draft after successful conversion
                        await db.delete(cvDrafts).where(eq(cvDrafts.id, draftId));
                      }
                      
                    } else {
                    }
                  } else {
                  }
                } catch (draftError: any) {
                  console.error(`❌ [WEBHOOK] Error converting draft ${draftId}:`, draftError);
                  // Don't fail the webhook for draft conversion errors
                }
              }
              
              // Send welcome premium email
              if (user.email && user.firstName) {
                try {
                  const { sendPremiumWelcomeEmail } = await import('./email');
                  await sendPremiumWelcomeEmail(
                    user.email, 
                    user.firstName, 
                    new Date((subscription as any).current_period_end * 1000)
                  );
                } catch (emailError: any) {
                  console.error('❌ Error sending premium welcome email:', emailError);
                }
              }
            } else {
              console.error(`❌ Could not find user for customer ${customerId}`);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;


          // Find user and handle payment failure
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            // You might want to send a notification or handle retry logic
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;


          // Find user and deactivate subscription
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateSubscriptionStatus(user.id, false);
          }
          break;
        }

        default:
      }

      // CORRECTION: Réponse envoyée seulement après traitement complet et réussi
      res.json({ received: true });
    } catch (error: any) {
      console.error(`❌ [WEBHOOK] Critical error processing ${event.type}:`, {
        eventId: event.id,
        error: error.message,
        stack: error.stack?.split('\n')[0],
        timestamp: new Date().toISOString()
      });
      // Return 400 to trigger Stripe retry - 500 suggests transient issue  
      res.status(400).send(`Webhook processing error: ${error.message}`);
    }
  };

  // Webhook handler moved to server/index.ts before express.json() middleware


  // Admin endpoint to clean up duplicate Stripe products
  app.post('/api/admin/cleanup-stripe-products', async (req, res) => {
    if (!stripe) {
      res.status(500).json({ message: "Stripe is not configured" });
      return;
    }

    try {
      // List all products
      const products = await stripe.products.list({ limit: 100 });
      
      // Find Brevy Pro products
      const brevyProducts = products.data.filter(product => 
        product.name === 'Brevy Pro' || product.name === 'Brevy Premium'
      );


      // Keep only the one with the configured price ID, delete others
      let keptProduct = null;
      const productsToDelete = [];

      for (const product of brevyProducts) {
        // Check if this product has the configured price
        const prices = await stripe.prices.list({ product: product.id });
        const hasConfiguredPrice = prices.data.some(price => price.id === process.env.STRIPE_PRICE_ID);
        
        if (hasConfiguredPrice && !keptProduct) {
          keptProduct = product;
        } else {
          productsToDelete.push(product);
        }
      }

      // Delete duplicate products and their prices
      for (const product of productsToDelete) {
        
        // First delete all prices for this product
        const prices = await stripe.prices.list({ product: product.id });
        for (const price of prices.data) {
          await stripe.prices.update(price.id, { active: false });
        }
        
        // Then delete the product
        await stripe.products.del(product.id);
      }

      res.json({ 
        message: `Cleaned up ${productsToDelete.length} duplicate products`,
        keptProduct: keptProduct?.id,
        deletedProducts: productsToDelete.length
      });

    } catch (error: any) {
      console.error('Error cleaning up Stripe products:', error);
      res.status(500).json({ message: 'Error cleaning up products', error: error.message });
    }
  });

  // DEBUG: Endpoint pour vérifier le statut d'abonnement d'un utilisateur
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/user/:userId/subscription', async (req, res) => {
      try {
        const { userId } = req.params;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        return res.json({
          userId: user.id,
          email: user.email,
          hasActiveSubscription: user.hasActiveSubscription,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          updatedAt: user.updatedAt
        });
      } catch (error) {
        console.error('Debug endpoint error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    app.get('/api/debug/user/email/:email/subscription', async (req, res) => {
      try {
        const { email } = req.params;
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        return res.json({
          userId: user.id,
          email: user.email,
          hasActiveSubscription: user.hasActiveSubscription,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          updatedAt: user.updatedAt
        });
      } catch (error) {
        console.error('Debug endpoint error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    // DEBUG: Endpoint pour activer manuellement Premium (test uniquement)
    app.post('/api/debug/activate-premium/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        
        const updatedUser = await storage.updateSubscriptionStatus(userId, true);
        
        
        return res.json({
          success: true,
          user: {
            userId: updatedUser.id,
            email: updatedUser.email,
            hasActiveSubscription: updatedUser.hasActiveSubscription,
            updatedAt: updatedUser.updatedAt
          }
        });
      } catch (error) {
        console.error('❌ [DEBUG] Manual activation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    // DEBUG: Endpoint pour tester si le webhook fonctionne
    app.get('/api/debug/webhook-test', (req, res) => {
      res.json({ 
        message: 'Webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookUrl: 'https://cvfolio.onrender.com/api/webhooks/stripe',
        stripeConfigured: !!stripe
      });
    });

    // Debug endpoint to test webhook URL
    app.get('/api/debug/webhook-test', async (req: any, res) => {
      res.json({
        message: 'Webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        url: 'https://cvfolio.onrender.com/api/webhooks/stripe'
      });
    });

    // Debug endpoint to check user and Stripe status
    app.get('/api/debug/user-status', async (req: any, res) => {
      if (!checkAuthentication(req, res)) {
        return;
      }

      try {
        const user = req.user;
        console.log('🔍 [DEBUG] Checking user status for:', user.id);
        
        const debugInfo = {
          userId: user.id,
          email: user.email,
          stripeCustomerId: user.stripeCustomerId,
          hasActiveSubscription: user.hasActiveSubscription,
          stripeSubscriptionId: user.stripeSubscriptionId
        };

        // Check Stripe customer if exists
        if (user.stripeCustomerId && stripe) {
          try {
            const customer = await stripe.customers.retrieve(user.stripeCustomerId);
            debugInfo.stripeCustomer = {
              id: customer.id,
              email: customer.email,
              deleted: customer.deleted
            };

            // Check subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: user.stripeCustomerId,
              status: 'active'
            });
            
            debugInfo.stripeSubscriptions = subscriptions.data.map(sub => ({
              id: sub.id,
              status: sub.status,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString()
            }));
          } catch (stripeError) {
            debugInfo.stripeError = stripeError.message;
          }
        }

        res.json(debugInfo);
      } catch (error: any) {
        console.error('❌ [DEBUG] Error checking user status:', error);
        res.status(500).json({ message: error.message });
      }
    });

    // DEBUG: Endpoint pour simuler un webhook (test uniquement)
    app.post('/api/debug/simulate-webhook', async (req, res) => {
      try {
        const { eventType, customerId, sessionId } = req.body;
        
        if (!eventType || !customerId) {
          return res.status(400).json({ error: 'eventType and customerId are required' });
        }

        // Simulate a webhook event
        const mockEvent = {
          id: `evt_test_${Date.now()}`,
          type: eventType,
          data: {
            object: {
              id: sessionId || `cs_test_${Date.now()}`,
              customer: customerId,
              // Add other fields as needed
            }
          }
        };

        console.log('🧪 [DEBUG] Simulating webhook event:', mockEvent);
        
        // Process the mock event (same logic as real webhook)
        if (eventType === 'checkout.session.completed') {
          const session = mockEvent.data.object;
          console.log('✅ [DEBUG] Simulating checkout.session.completed for session:', session.id);
          
          if (session.customer) {
            try {
              const customerObj = await stripe?.customers.retrieve(session.customer);
              if (customerObj && !customerObj.deleted) {
                if (customerObj.metadata?.userId) {
                  const userId = customerObj.metadata.userId;
                  console.log('✅ [DEBUG] Found user by metadata:', userId);
                  
                  const updatedUser = await storage.updateSubscriptionStatus(userId, true);
                  console.log('✅ [DEBUG] Premium status activated for user:', userId);
                  
                  return res.json({
                    success: true,
                    message: 'Webhook simulation successful',
                    userId: userId,
                    userUpdated: true
                  });
                } else {
                  return res.json({
                    success: false,
                    message: 'No userId in customer metadata',
                    customerEmail: customerObj.email
                  });
                }
              }
            } catch (error) {
              console.error('❌ [DEBUG] Error in webhook simulation:', error);
              return res.status(500).json({ error: 'Webhook simulation failed' });
            }
          }
        }
        
        return res.json({
          success: true,
          message: 'Webhook simulation completed',
          eventType: eventType
        });
      } catch (error) {
        console.error('❌ [DEBUG] Webhook simulation error:', error);
        return res.status(500).json({ error: 'Simulation failed' });
      }
    });

    // DEBUG: Endpoint pour vérifier le statut de paiement d'un utilisateur
    app.get('/api/debug/user/:userId/payment-status', async (req, res) => {
      try {
        const { userId } = req.params;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        let stripeStatus = null;
        if (user.stripeCustomerId && stripe) {
          try {
            const customer = await stripe.customers.retrieve(user.stripeCustomerId);
            if (!customer.deleted) {
              const subscriptions = await stripe.subscriptions.list({
                customer: user.stripeCustomerId,
                status: 'active'
              });
              stripeStatus = {
                customerId: customer.id,
                hasActiveSubscriptions: subscriptions.data.length > 0,
                subscriptions: subscriptions.data.map(sub => ({
                  id: sub.id,
                  status: sub.status,
                  currentPeriodEnd: sub.current_period_end
                }))
              };
            }
          } catch (stripeError) {
            stripeStatus = { error: 'Failed to fetch Stripe data' };
          }
        }
        
        return res.json({
          userId: user.id,
          email: user.email,
          hasActiveSubscription: user.hasActiveSubscription,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          stripeStatus,
          updatedAt: user.updatedAt
        });
      } catch (error) {
        console.error('Debug endpoint error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }


  // FALLBACK: Endpoint pour vérifier le statut de paiement et activer Premium si nécessaire
  app.post('/api/fallback-premium-activation', async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }

    try {
      let user = req.user;
      console.log('🔄 [FALLBACK] Checking payment status for user:', user.id);
      console.log('🔍 [FALLBACK] User stripeCustomerId:', user.stripeCustomerId);
      console.log('🔍 [FALLBACK] User email:', user.email);
      console.log('🔍 [FALLBACK] User hasActiveSubscription:', user.hasActiveSubscription);
      console.log('🔍 [FALLBACK] Stripe configured:', !!stripe);

      if (!user.stripeCustomerId) {
        console.log('❌ [FALLBACK] No Stripe customer ID for user:', user.id);
        console.log('🔍 [FALLBACK] Attempting to find user by email:', user.email);
        
        // Try to find user by email in Stripe customers
        if (user.email) {
          try {
            const customers = await stripe.customers.list({
              email: user.email,
              limit: 1
            });
            
            if (customers.data.length > 0) {
              const customer = customers.data[0];
              console.log('✅ [FALLBACK] Found Stripe customer by email:', customer.id);
              
              // Update user with found customer ID
              const updatedUser = await storage.updateStripeCustomerId(user.id, customer.id);
              console.log('✅ [FALLBACK] Updated user with customer ID:', updatedUser.stripeCustomerId);
              
              // Continue with the normal flow using the found customer
              user = updatedUser;
            } else {
              console.log('❌ [FALLBACK] No Stripe customer found for email:', user.email);
              return res.status(400).json({ 
                success: false,
                message: 'No Stripe customer found. Please try subscribing again.' 
              });
            }
          } catch (emailError) {
            console.error('❌ [FALLBACK] Error searching for customer by email:', emailError);
            return res.status(500).json({ 
              success: false,
              message: 'Error checking subscription status' 
            });
          }
        } else {
          return res.status(400).json({ 
            success: false,
            message: 'No Stripe customer ID found. Please try subscribing again.' 
          });
        }
      }

      if (!stripe) {
        console.log('❌ [FALLBACK] Stripe not configured');
        return res.status(500).json({ 
          success: false,
          message: 'Stripe service not available' 
        });
      }

      // Check Stripe for active subscriptions
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (customer.deleted) {
        return res.status(400).json({ 
          success: false,
          message: 'Stripe customer deleted' 
        });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active'
      });

      if (subscriptions.data.length > 0) {
        // User has active subscription in Stripe but not in our DB
        console.log('✅ [FALLBACK] Found active subscription in Stripe, activating Premium');

        const updatedUser = await storage.updateSubscriptionStatus(user.id, true);

        // Synchronize session user immediately so /api/user reflects Premium
        try {
          req.user = { ...(req.user || {}), ...updatedUser };
          if (typeof req.login === 'function') {
            await new Promise<void>((resolve, reject) => {
              req.login(req.user, (err: any) => (err ? reject(err) : resolve()));
            });
          }
          if (req.session && typeof req.session.save === 'function') {
            await new Promise<void>((resolve) => req.session.save(() => resolve()));
          }
          console.log('✅ [FALLBACK] Session user synchronized with Premium status');
        } catch (sessErr) {
          console.error('⚠️ [FALLBACK] Failed to sync session user:', sessErr);
        }

        return res.json({
          success: true,
          message: 'Premium status activated successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            hasActiveSubscription: updatedUser.hasActiveSubscription
          }
        });
      } else {
        return res.json({
          success: false,
          message: 'No active subscription found in Stripe'
        });
      }
    } catch (error) {
      console.error('❌ [FALLBACK] Error checking payment status:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error checking payment status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // As-requested: Force-activate premium for the authenticated user
  // Use only as a last resort when Stripe webhooks or fallback cannot update in time
  app.post('/api/force-activate-premium', async (req: any, res) => {
    if (!checkAuthentication(req, res)) {
      return;
    }
    try {
      const user = req.user;
      const updatedUser = await storage.updateSubscriptionStatus(user.id, true);

      // Sync session user immediately
      try {
        req.user = { ...(req.user || {}), ...updatedUser };
        if (typeof req.login === 'function') {
          await new Promise<void>((resolve, reject) => {
            req.login(req.user, (err: any) => (err ? reject(err) : resolve()));
          });
        }
        if (req.session && typeof req.session.save === 'function') {
          await new Promise<void>((resolve) => req.session.save(() => resolve()));
        }
      } catch {
        // Non-fatal
      }

      return res.json({
        success: true,
        message: 'Premium status force-activated',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          hasActiveSubscription: updatedUser.hasActiveSubscription
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to force-activate premium' });
    }
  });

  // Route pour supprimer un compte utilisateur par email (GET pour faciliter l'utilisation)
  app.get("/api/debug/delete-user/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete all CVs for this user
      await storage.deleteAllCVsForUser(user.id);

      // Delete user
      await storage.deleteUser(user.id);

      res.json({ message: `User ${email} and all associated data deleted successfully` });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Setup authentication routes
  await setupAuth(app);

  const httpServer = createServer(app);
  return httpServer;
}
