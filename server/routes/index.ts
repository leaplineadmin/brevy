import { Express } from 'express';
import { errorHandler, notFoundHandler } from '../middleware/error.middleware';
import authRoutes from './auth.routes';
import cvRoutes from './cv.routes';
import uploadRoutes from './upload.routes';
import userRoutes from './user.routes';

export const registerRoutes = (app: Express) => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cv', cvRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/user', userRoutes);

  // Legacy routes (to be migrated gradually)
  // These will be moved to their respective route files
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Language setting
  app.post('/api/set-language', (req, res) => {
    const { language } = req.body;
    if (language && ['en', 'fr'].includes(language)) {
      res.cookie('lang', language, { 
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ message: 'Invalid language' });
    }
  });

  // Image proxy for CORS
  app.get('/api/image-proxy', async (req, res) => {
    const { url, circular } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL is required' });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ message: 'Failed to fetch image' });
    }
  });

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);
};
