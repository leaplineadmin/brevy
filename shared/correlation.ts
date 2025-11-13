// Correlation ID utilities pour traçabilité complète du flow
import { v4 as uuidv4 } from 'uuid';

export function generateCorrelationId(): string {
  return uuidv4().substring(0, 8); // Court mais unique pour les logs
}

export function extractCorrelationId(headers: any): string {
  return headers['x-cid'] || headers['X-CID'] || 'unknown';
}

export interface LogContext {
  cid: string;
  userId?: string;
  draftId?: string;
  hasSession?: boolean;
  cookiePresent?: boolean;
  referer?: string;
  origin?: string;
  action?: string;
}

export function createLogContext(req: any, extra: Partial<LogContext> = {}): LogContext {
  return {
    cid: extractCorrelationId(req.headers),
    userId: req.user?.id,
    hasSession: !!req.session,
    cookiePresent: !!req.cookies?.['connect.sid'],
    referer: req.headers.referer,
    origin: req.headers.origin,
    ...extra
  };
}