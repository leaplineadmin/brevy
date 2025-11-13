import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any;
  isAuthenticated?: () => boolean;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  if (!isAuthenticated) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // This middleware just passes through, but adds type safety
  next();
};
