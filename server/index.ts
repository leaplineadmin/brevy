import express, { type Request, Response, NextFunction } from "express";
import passport from "passport";
import cors from "cors";
import cookieParser from "cookie-parser";
import Stripe from "stripe";
import prerender from "prerender-node";

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

// Extend the Express Request interface to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ConfigChecker } from "./configChecker";
import { logProductionReadiness } from "./productionCheck";
import { setupAuth } from "./auth";
import { DatabaseStorage } from "./storage";
import fs from "fs";
import path from "path";

const app = express();

// Créer le dossier uploads s'il n'existe pas (important pour Render)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads créé:', uploadsDir);
} else {
  console.log('✅ Dossier uploads existe déjà:', uploadsDir);
}

// Vérifier les variables d'environnement critiques
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY n\'est pas définie !');
} else {
  console.log('✅ OPENAI_API_KEY est définie');
}

// We are behind Vercel/Render proxies; trust them so secure cookies work
app.set('trust proxy', 1);

// Raw body parser for Stripe webhooks
const rawBodyBuffer = (req: Request, _res: Response, buf: Buffer, encoding: BufferEncoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

// === CORS CONFIG ===
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:10000",
  "http://127.0.0.1:10000",
  "https://brevy.me",
  "https://www.brevy.me",
  "https://cvfolio.onrender.com",
  "https://cvfolio-pr-4.onrender.com/",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.options("*", cors());

// === DEBUG MIDDLEWARE: Log all bot requests for troubleshooting ===
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isBot = userAgent.includes('Googlebot') || 
                userAgent.includes('Bingbot') || 
                userAgent.includes('LinkedInBot') ||
                userAgent.includes('facebookexternalhit') ||
                userAgent.includes('Twitterbot') ||
                userAgent.includes('Prerender') ||
                userAgent.includes('Slackbot') ||
                userAgent.includes('WhatsApp');
  
  if (isBot) {
    console.log(`🔍 [BOT DETECTION] Bot request detected: ${userAgent.substring(0, 100)}`);
    console.log(`🔍 [BOT DETECTION] URL: ${req.url}`);
    console.log(`🔍 [BOT DETECTION] Headers: X-Prerender=${req.get('X-Prerender')}, X-Prerender-Token=${req.get('X-Prerender-Token') ? 'present' : 'missing'}`);
  }
  next();
});

// === PRERENDER.IO MIDDLEWARE FOR SEO ===
// Configure prerender-node to serve pre-rendered HTML to search engine bots
// This middleware detects bots (Googlebot, Bingbot, LinkedInBot, etc.) and serves
// a pre-rendered version of the homepage for better SEO indexing
const prerenderToken = process.env.PRERENDER_TOKEN || process.env.PRERENDERIO_TOKEN;
if (prerenderToken && prerenderToken !== 'disabled') {
  console.log('✅ [PRERENDER] Prerender.io token found, enabling pre-rendering service');
} else {
  console.warn('⚠️ [PRERENDER] No Prerender.io token found. Set PRERENDER_TOKEN or PRERENDERIO_TOKEN environment variable to enable pre-rendering.');
  console.warn('⚠️ [PRERENDER] Pre-rendering will be disabled. Bots will receive the SPA shell.');
}

app.use(prerender
  .set('prerenderToken', prerenderToken || 'disabled') // Use Prerender.io token if available, otherwise disabled
  .set('protocol', 'https') // Use HTTPS for pre-rendering
  .set('host', 'brevy.me') // Set the host for pre-rendering (actual production domain)
  .set('forwardHeaders', true) // Forward original headers to Prerender.io
  .set('waitFor', 5000) // Wait up to 5 seconds for window.prerenderReady to be true (increased for slower loads)
  .set('followRedirects', true) // Follow redirects during pre-rendering
  .set('beforeRender', function(req: any, done: any) {
    // Log when a bot request is being pre-rendered
    const userAgent = req.get('User-Agent') || 'unknown';
    const botName = userAgent.includes('Googlebot') ? 'Googlebot' : 
                    userAgent.includes('Bingbot') ? 'Bingbot' : 
                    userAgent.includes('LinkedInBot') ? 'LinkedInBot' : 
                    userAgent.includes('facebookexternalhit') ? 'Facebook' : 
                    userAgent.includes('Twitterbot') ? 'Twitterbot' : 
                    userAgent.includes('Slackbot') ? 'Slackbot' :
                    userAgent.includes('WhatsApp') ? 'WhatsApp' : 'Unknown Bot';
    
    console.log(`🤖 [PRERENDER] Bot detected: ${botName} - Pre-rendering ${req.url}`);
    console.log(`🤖 [PRERENDER] User-Agent: ${userAgent}`);
    console.log(`🤖 [PRERENDER] Token status: ${prerenderToken ? 'Configured' : 'Disabled'}`);
    done();
  })
  .set('afterRender', function(err: any, req: any, res: any) {
    if (err) {
      console.error(`❌ [PRERENDER] Error pre-rendering for ${req.url}:`, err);
      console.error(`❌ [PRERENDER] Error details:`, err.message || err);
    } else {
      console.log(`✅ [PRERENDER] Successfully pre-rendered ${req.url} for bot`);
    }
  })
  .set('shouldPrerender', function(req: any) {
    const url = req.url;
    const userAgent = req.get('User-Agent') || '';
    
    // NEVER pre-render JavaScript files, CSS files, or API routes
    if (url.endsWith('.js') || url.endsWith('.mjs') || url.endsWith('.css') || 
        url.endsWith('.json') || url.endsWith('.xml') || url.endsWith('.txt') ||
        url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/dev/') ||
        url.includes('google') || url.includes('oauth') || url.includes('callback') ||
        url.startsWith('/assets/') || url.startsWith('/src/') || url.startsWith('/@')) {
      return false;
    }
    
    // IMPORTANT: Allow Prerender.io's own requests to pass through (for validation)
    // Prerender.io makes requests with specific headers to validate integration
    // We should NOT intercept these, but we also shouldn't pre-render them
    // The middleware will handle them correctly if we return false
    if (userAgent.includes('Prerender') || req.get('X-Prerender') || req.get('X-Prerender-Token')) {
      console.log(`🔄 [PRERENDER] Prerender.io validation request detected - allowing through`);
      return false; // Don't pre-render, but allow the request to pass
    }
    
    // Pre-render the homepage, shared CVs, and article/blog pages
    // Add your article routes here (e.g., /articles/*, /blog/*, etc.)
    const shouldPrerender = 
      url === '/' || 
      url === '/fr' || 
      url === '/fr/' || 
      url.startsWith('/cv/') ||
      url.startsWith('/articles/') ||  // Example: /articles/my-article-title
      url === '/blog' ||                // Blog listing page
      url.startsWith('/blog/');         // Example: /blog/article-1
    
    if (shouldPrerender) {
      console.log(`🔍 [PRERENDER] Will pre-render: ${url} for bot: ${userAgent.substring(0, 50)}`);
    }
    
    return shouldPrerender;
  })
);

// NOTE: Session and passport are initialized in setupAuth() within registerRoutes

// === SECURITY HEADERS ===
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Force no-cache for JavaScript assets and HTML to prevent stale versions
  if (req.url.endsWith('.js') || req.url.endsWith('.mjs') || 
      req.url === '/' || req.url.startsWith('/auth') || req.url.startsWith('/dashboard')) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  
  next();
});
// CRITICAL: Register Stripe webhook BEFORE express.json() to preserve raw body
if (stripe) {
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('❌ [WEBHOOK] Webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    // Use req.body directly since express.raw middleware puts raw body there
    const rawBody = req.body;

    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
    } catch (err: any) {
      console.error('❌ [WEBHOOK] Signature verification failed:', err.message);
      console.error('❌ [WEBHOOK] Raw body length:', rawBody.length);
      console.error('❌ [WEBHOOK] Signature header:', sig ? 'Present' : 'Missing');
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    // Use static import to avoid dynamic import issues
    const storage = new DatabaseStorage();

    try {
      console.log(`🔔 [WEBHOOK] Processing event: ${event.type} (ID: ${event.id})`);
      
      // Check for duplicate events (Stripe best practice)
      // In production, you should store processed event IDs in a database
      // For now, we'll just log it
      console.log(`📝 [WEBHOOK] Event ID: ${event.id}, Type: ${event.type}`);
      
      // Return 200 immediately to acknowledge receipt (Stripe best practice)
      res.json({ received: true });
      
      // Process the event asynchronously
      setImmediate(async () => {
        try {
          await processWebhookEvent(event, storage);
        } catch (error) {
          console.error('❌ [WEBHOOK] Error processing event asynchronously:', error);
        }
      });
      
    } catch (error) {
      console.error('❌ [WEBHOOK] Error in webhook handler:', error);
      console.error('❌ [WEBHOOK] Event type:', event.type);
      console.error('❌ [WEBHOOK] Event ID:', event.id);
      
      // Always return 200 to prevent Stripe from retrying
      res.status(200).json({ 
        received: true, 
        error: 'Webhook processing failed but acknowledged' 
      });
    }
  });
}

// Separate function to process webhook events asynchronously
async function processWebhookEvent(event: any, storage: any) {
  try {
    switch (event.type) {
             case 'checkout.session.completed': {
               const session = event.data.object as any;
               console.log('✅ [WEBHOOK] checkout.session.completed received for session:', session.id);
               console.log('🔍 [WEBHOOK] Session customer:', session.customer);
               console.log('🔍 [WEBHOOK] Session payment status:', session.payment_status);
               console.log('🔍 [WEBHOOK] Session customer email:', session.customer_details?.email);
               console.log('🔍 [WEBHOOK] Session mode:', session.mode);
        
        if (!session.customer) {
          console.error('❌ [WEBHOOK] No customer in session:', session.id);
          return;
        }

        let userId: string | null = null;
        
        try {
          // Find user by customer ID - try metadata first
          const customerObj = await stripe.customers.retrieve(session.customer as string);
          
          if (!customerObj || customerObj.deleted) {
            console.error(`❌ [WEBHOOK] Customer not found or deleted: ${session.customer}`);
            return;
          }

          if (customerObj.metadata?.userId) {
            userId = customerObj.metadata.userId;
            console.log('✅ [WEBHOOK] Found user by metadata:', userId);
          } else {
            // FALLBACK: Try to find user by email if metadata is missing
            if (customerObj.email) {
              try {
                const userByEmail = await storage.getUserByEmail(customerObj.email);
                if (userByEmail) {
                  userId = userByEmail.id;
                  console.log('✅ [WEBHOOK] Found user by email:', userId);
                  
                  // Update customer metadata for future use
                  try {
                    await stripe.customers.update(session.customer as string, {
                      metadata: { userId: userId }
                    });
                  } catch (updateError) {
                    console.error('❌ [WEBHOOK] Failed to update customer metadata:', updateError);
                    // Continue anyway, this is not critical
                  }
                } else {
                  console.error(`❌ [WEBHOOK] User not found for email ${customerObj.email}`);
                }
              } catch (emailError) {
                console.error('❌ [WEBHOOK] Error finding user by email:', emailError);
              }
            } else {
              console.error(`❌ [WEBHOOK] No email found for customer ${session.customer}`);
            }
          }
          
          if (userId) {
            // Immediately activate Premium status
            console.log('✅ [WEBHOOK] Activating Premium status for user:', userId);
            try {
              const updatedUser = await storage.updateSubscriptionStatus(userId, true);
              console.log('✅ [WEBHOOK] Premium status activated successfully for user:', userId);
            } catch (updateError) {
              console.error(`❌ [WEBHOOK] Failed to update subscription status for user ${userId}:`, updateError);
              // Don't throw here, just log the error
            }
          } else {
            console.error(`❌ [WEBHOOK] No userId found for customer ${session.customer}`);
          }
        } catch (customerError) {
          console.error('❌ [WEBHOOK] Error processing customer:', customerError);
        }
        break;
      }
        
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer as string;
        console.log('✅ [WEBHOOK] invoice.payment_succeeded received for customer:', customerId);

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
            console.log('✅ [WEBHOOK] Activating subscription for user:', user.id);
            await storage.updateSubscriptionStatus(user.id, true);
          } else {
            console.error(`❌ [WEBHOOK] User not found for customer ${customerId}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        console.log('✅ [WEBHOOK] customer.subscription.updated received for customer:', customerId);
        console.log('🔍 [WEBHOOK] Cancel at period end:', subscription.cancel_at_period_end);

        // Find user by customer ID
        let user = await storage.getUserByStripeCustomerId(customerId);
        
        if (!user) {
          // FALLBACK: Try to find user by email
          const customerObj = await stripe.customers.retrieve(customerId);
          if (customerObj && !customerObj.deleted && customerObj.email) {
            const userByEmail = await storage.getUserByEmail(customerObj.email);
            if (userByEmail) {
              user = userByEmail;
              await storage.updateStripeCustomerId(user.id, customerId);
            }
          }
        }
        
        if (user) {
          if (subscription.cancel_at_period_end) {
            // User cancelled subscription - remove premium access immediately
            console.log('✅ [WEBHOOK] Removing premium access immediately for user:', user.id);
            await storage.updateSubscriptionStatus(user.id, false);
          } else {
            // Subscription was reactivated
            console.log('✅ [WEBHOOK] Reactivating subscription for user:', user.id);
            await storage.updateSubscriptionStatus(user.id, true);
          }
        } else {
          console.error(`❌ [WEBHOOK] User not found for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        console.log('✅ [WEBHOOK] customer.subscription.deleted received for customer:', customerId);

        // Find user by customer ID
        let user = await storage.getUserByStripeCustomerId(customerId);
        
        if (!user) {
          // FALLBACK: Try to find user by email
          const customerObj = await stripe.customers.retrieve(customerId);
          if (customerObj && !customerObj.deleted && customerObj.email) {
            const userByEmail = await storage.getUserByEmail(customerObj.email);
            if (userByEmail) {
              user = userByEmail;
              await storage.updateStripeCustomerId(user.id, customerId);
            }
          }
        }
        
        if (user) {
          // Subscription is deleted - remove premium access
          console.log('✅ [WEBHOOK] Removing premium access for user:', user.id);
          await storage.updateSubscriptionStatus(user.id, false);
        } else {
          console.error(`❌ [WEBHOOK] User not found for customer ${customerId}`);
        }
        break;
      }
      
      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook event:', error);
    console.error('❌ [WEBHOOK] Event type:', event.type);
    console.error('❌ [WEBHOOK] Event ID:', event.id);
  }
}

app.use(cookieParser());
app.use(express.json({ 
  verify: rawBodyBuffer
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Log détaillé pour diagnostiquer les erreurs 500 avec Chrome
    if (res.statusCode >= 500) {
      const userAgent = req.get('User-Agent') || 'unknown';
      const acceptEncoding = req.get('Accept-Encoding') || 'none';
      const secChUa = req.get('sec-ch-ua') || 'none';
      
      console.error(`🚨 500 ERROR: ${req.method} ${path} - UA: ${userAgent.substring(0, 100)} - Encoding: ${acceptEncoding} - sec-ch-ua: ${secChUa}`);
    }
    
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Enhanced health check endpoint for deployment - defined early to avoid middleware conflicts
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: process.env.PORT ? parseInt(process.env.PORT) : 10000,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: false,
        storage: false
      },
      uptime: process.uptime()
    };

    // Check database connection
    try {
      const { storage } = await import('./storage');
      await storage.healthCheck?.() || Promise.resolve();
      healthStatus.services.database = true;
    } catch (error) {
      healthStatus.services.database = false;
    }

    // Check S3/storage service
    try {
      const { s3Service } = await import('./s3Service');
      healthStatus.services.storage = s3Service.isAvailable();
    } catch (error) {
      healthStatus.services.storage = false;
    }

    // Determine overall health status
    const allServicesHealthy = Object.values(healthStatus.services).every(service => service === true);
    
    if (!allServicesHealthy) {
      healthStatus.status = 'degraded';
      return res.status(200).json(healthStatus); // Still return 200 for partial functionality
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      port: process.env.PORT ? parseInt(process.env.PORT) : 10000
    });
  }
});

// Setup authentication routes will be done in the main function

// Middleware pour gérer les sous-domaines CV
app.use(async (req, res, next) => {
  // Récupérer le vrai host depuis les headers Cloudflare
  const originalHost = req.get('x-forwarded-host') || req.get('x-original-host') || req.get('host') || '';
  const host = originalHost;
  const path = req.path;
  
  // Skip logging for dev assets
  
  // Skip middleware for API routes, health check, static assets, and dev routes
  if (path.startsWith('/api') || path.startsWith('/health') || path.startsWith('/dev') || path.startsWith('/assets') || path.startsWith('/src/') || path.startsWith('/@')) {
    return next();
  }
  
  // Détection du sous-domaine - avec plusieurs méthodes de fallback
  let detectedSubdomain = null;
  
  // Méthode 1: Host header classique
  if (host.includes('.brevy.me') && !host.startsWith('www.') && !host.includes('localhost')) {
    detectedSubdomain = host.split('.')[0];

  }
  
  // Méthode 2: URL path analysis (/cv/subdomain)
  if (!detectedSubdomain && path.startsWith('/cv/') && path !== '/cv/not-found') {
    detectedSubdomain = path.split('/')[2];

  }
  
  // Si on a un sous-domaine détecté, traiter la requête
  if (detectedSubdomain && detectedSubdomain !== 'not-found') {

    
    try {
      const { storage } = await import('./storage');
      const cv = await storage.getCVBySubdomain(detectedSubdomain);
      
      if (cv && cv.isPublished) {
        // Si c'est déjà une route /cv/, continuer normalement
        if (path.startsWith('/cv/')) {
          return next();
        }
        // Rediriger vers /cv/ pour que le frontend React gère l'affichage
        // Le frontend détectera le sous-domaine depuis l'URL
        return res.redirect(`/cv/${detectedSubdomain}`);
      } else {

        return res.redirect('/cv/not-found');
      }
    } catch (error) {
      return res.redirect('/cv/not-found');
    }
  }
  
  next();
});

(async () => {
  // Vérifier la configuration en production
  if (process.env.NODE_ENV === "production") {
    logProductionReadiness();
  }
  
  // Setup authentication (Google OAuth, sessions, etc.)
  setupAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log détaillé des erreurs 500 avec Chrome pour debugging
    if (status >= 500) {
      const userAgent = req.get('User-Agent') || 'unknown';
      const acceptEncoding = req.get('Accept-Encoding') || 'none';
      const secChUa = req.get('sec-ch-ua') || 'none';
      
      console.error(`🚨 SERVER ERROR ${status}: ${req.method} ${req.path}`);
      console.error(`📱 User-Agent: ${userAgent}`);
      console.error(`🗜️ Accept-Encoding: ${acceptEncoding}`);
      console.error(`🔒 sec-ch-ua: ${secChUa}`);
      console.error(`❌ Error message: ${message}`);
      console.error(`📍 Stack trace:`, err.stack);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Render injecte la variable PORT, utiliser celle-ci en priorité
  // Sinon utiliser 10000 par défaut pour Render
  const port = process.env.PORT ? parseInt(process.env.PORT) : 10000;
  

  // Configuration du serveur selon l'environnement
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} ${process.env.NODE_ENV === "production" ? "(production)" : "(development)"}`);
    
    // Run config checking asynchronously after server starts to avoid blocking deployment
    setTimeout(() => {
      ConfigChecker.printStatus();
    }, 1000);
  });
})();
