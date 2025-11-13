// server/auth.ts
import express, { type Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";

const authRouter = express.Router();

// Ephemeral session bridge to move auth across domains via frontend proxy
const pendingSessions = new Map<string, { user: any; expiresAt: number }>();

// ====== ENV ======
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SESSION_SECRET,
} = process.env;

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "https://www.brevy.me";
const GOOGLE_CALLBACK_URL = `https://cvfolio.onrender.com/api/google/callback`;

// ====== Passport serialize/deserialize ======
passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// ====== Google Strategy ======
// Only configure Google OAuth if credentials are available
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
    },
    async (_req, _accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || "";
        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Import storage dynamically to avoid circular dependencies
        const { storage } = await import('./storage');
        
        // Check if user already exists
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user
          const newId = uuidv4();
          user = await storage.upsertUser({
            id: newId,
            email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            provider: "google",
            language: "en", // Default to English for new Google users
          });
          
          // Send welcome email for new Google OAuth users
          try {
            const { sendWelcomeEmail } = await import('./email');
            await sendWelcomeEmail(user.email!, user.firstName || 'User');
          } catch (emailError) {
            console.error('Failed to send welcome email for Google OAuth user:', emailError);
            // Don't fail OAuth if email fails
          }
        } else {
          // Update existing user with Google info if needed
          if (!user.firstName && profile.name?.givenName) {
            user = await storage.updateUser(user.id, {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName || user.lastName,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
        return done(err as any);
      }
    }
  )
  );
} else {
  console.log('⚠️  Google OAuth credentials not found. Google login will be disabled.');
}

// ====== Routes OAuth ======

// Démarre l'OAuth Google en propageant le state éventuel
authRouter.get(
  "/google",
  (req, res, next) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const userAgent = req.get('User-Agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    console.log('🔄 [GOOGLE OAUTH] Starting OAuth flow:', {
      state: state.substring(0, 20) + (state.length > 20 ? '...' : ''),
      userAgent: userAgent.substring(0, 50) + '...',
      isIOS,
      ip: req.ip,
      referer: req.get('Referer')
    });
    
    (passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state,
    }) as any)(req, res, next);
  }
);

// Callback Google (doit matcher exactement la valeur configurée côté Google)
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/failure" }),
  (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const userAgent = req.get('User-Agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    console.log('🔄 [GOOGLE OAUTH] Callback received:', {
      state: state.substring(0, 20) + (state.length > 20 ? '...' : ''),
      userAgent: userAgent.substring(0, 50) + '...',
      isIOS,
      hasUser: !!req.user,
      userEmail: req.user?.email,
      ip: req.ip
    });
    
    // Create a short-lived token to establish session on frontend domain
    const token = uuidv4();
    pendingSessions.set(token, { user: req.user, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes
    
    console.log('🔄 [GOOGLE OAUTH] Token created:', {
      token: token.substring(0, 8) + '...',
      pendingSessionsCount: pendingSessions.size,
      userEmail: req.user?.email
    });
    
    // Also establish session on backend domain for API calls
    req.login(req.user, (err) => {
      if (err) {
        console.error('❌ [GOOGLE OAUTH] Session login failed:', err);
        return res.redirect(`${FRONT_ORIGIN}/auth?error=session_failed`);
      }
      
      const redirectDest = `/auth?token=${encodeURIComponent(token)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
      console.log('🔄 [GOOGLE OAUTH] Redirecting to:', `${FRONT_ORIGIN}${redirectDest}`);
      res.redirect(`${FRONT_ORIGIN}${redirectDest}`);
    });
  }
);

// Page d'échec (optionnel)
authRouter.get("/failure", (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  console.log('❌ [GOOGLE OAUTH] Authentication failed:', {
    userAgent: userAgent.substring(0, 50) + '...',
    isIOS,
    ip: req.ip,
    referer: req.get('Referer')
  });
  
  res.redirect(`${FRONT_ORIGIN}/auth?error=google_auth_failed`);
});

// ====== export compat : setupAuth() ======
// Ton server/routes.ts appelle setupAuth(app). On le fournit ici.
export function setupAuth(app: Express) {
  if (!SESSION_SECRET) {
    // Eviter un crash silencieux
    console.warn("[auth] SESSION_SECRET manquant dans les variables Render");
  }

  // Configure session cookie for the frontend domain
  app.use(
    session({
      secret: SESSION_SECRET || "change-me",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 30,
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/api', authRouter);

  // Endpoint called from the frontend domain (via Vercel proxy) to finalize session
  authRouter.get("/session/consume", (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const userAgent = req.get('User-Agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    console.log('🔄 [SESSION CONSUME] Token consumption attempt:', {
      token: token.substring(0, 8) + (token.length > 8 ? '...' : ''),
      userAgent: userAgent.substring(0, 50) + '...',
      isIOS,
      ip: req.ip,
      pendingSessionsCount: pendingSessions.size
    });
    
    if (!token) {
      console.log('❌ [SESSION CONSUME] Missing token');
      return res.status(400).json({ message: 'Missing token' });
    }
    
    const pending = pendingSessions.get(token);
    if (!pending) {
      console.log('❌ [SESSION CONSUME] Token not found in pending sessions');
      return res.status(410).json({ message: 'Token expired or invalid' });
    }
    
    if (Date.now() > pending.expiresAt) {
      console.log('❌ [SESSION CONSUME] Token expired');
      pendingSessions.delete(token);
      return res.status(410).json({ message: 'Token expired' });
    }
    
    console.log('🔄 [SESSION CONSUME] Token valid, establishing session for user:', pending.user?.email);
    pendingSessions.delete(token);
    
    req.login(pending.user, (err) => {
      if (err) {
        console.error('❌ [SESSION CONSUME] Session login failed:', err);
        return res.status(500).json({ message: 'Failed to establish session' });
      }
      
      console.log('✅ [SESSION CONSUME] Session established successfully for:', pending.user?.email);
      return res.json({ success: true, user: pending.user });
    });
  });

  // Endpoint to check session status
  authRouter.get("/session/status", (req, res) => {
    console.log('🔍 [SESSION] Status check:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      hasUser: !!req.user,
      sessionID: req.sessionID,
      cookies: req.cookies,
      pendingSessionsCount: pendingSessions.size
    });

    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json({ 
        authenticated: true, 
        user: req.user,
        sessionId: req.sessionID 
      });
    }
    return res.json({ authenticated: false });
  });

  // Debug endpoint for pending sessions
  authRouter.get("/session/debug", (req, res) => {
    const pendingSessionsList = Array.from(pendingSessions.entries()).map(([token, data]) => ({
      token: token.substring(0, 8) + '...',
      expiresAt: data.expiresAt,
      expired: Date.now() > data.expiresAt,
      userEmail: data.user?.email
    }));

    return res.json({
      pendingSessionsCount: pendingSessions.size,
      pendingSessions: pendingSessionsList,
      currentSession: {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        sessionID: req.sessionID
      }
    });
  });
}

// Export supplémentaire si tu veux monter le router autrement
export default authRouter;
export { authRouter };
