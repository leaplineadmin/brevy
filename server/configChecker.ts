import { s3Service } from './s3Service';

/**
 * Utilitaire pour vérifier la configuration du stockage d'images
 */
export class ConfigChecker {
  static checkS3Configuration(): {
    isConfigured: boolean;
    missingVars: string[];
    recommendations: string[];
  } {
    const missingVars: string[] = [];
    const recommendations: string[] = [];

    // Vérifier les variables essentielles (priorité aux variables Scaleway/S3 spécifiques)
    const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!accessKey) {
      missingVars.push('S3_ACCESS_KEY_ID ou AWS_ACCESS_KEY_ID');
    }
    if (!secretKey) {
      missingVars.push('S3_SECRET_ACCESS_KEY ou AWS_SECRET_ACCESS_KEY');
    }
    if (!process.env.S3_BUCKET_NAME) {
      missingVars.push('S3_BUCKET_NAME');
    }

    // Recommandations basées sur la configuration
    if (!process.env.AWS_REGION && !process.env.S3_REGION) {
      recommendations.push('Set AWS_REGION or S3_REGION (default: us-east-1)');
    }

    if (process.env.S3_ENDPOINT && !process.env.S3_ENDPOINT.startsWith('https://')) {
      recommendations.push('S3_ENDPOINT should start with https://');
    }

    const isConfigured = missingVars.length === 0 && s3Service.isAvailable();

    return {
      isConfigured,
      missingVars,
      recommendations,
    };
  }

  static getStorageStatus(): {
    type: 'cloud' | 'local' | 'error';
    message: string;
    details?: any;
  } {
    const config = this.checkS3Configuration();
    
    if (config.isConfigured) {
      return {
        type: 'cloud',
        message: 'Cloud storage configured and functional',
        details: {
          provider: process.env.S3_ENDPOINT ? 
            (process.env.S3_ENDPOINT.includes('scw.cloud') ? 'Scaleway Object Storage' : 'Custom S3-compatible') : 
            'AWS S3',
          region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.S3_BUCKET_NAME,
          endpoint: process.env.S3_ENDPOINT,
        },
      };
    }

    if (config.missingVars.length > 0) {
      return {
        type: 'local',
        message: 'Local storage enabled - Cloud configuration missing',
        details: {
          missingVars: config.missingVars,
          recommendations: config.recommendations,
          fallback: 'Images will be stored locally and may be lost during redeployment',
        },
      };
    }

    return {
      type: 'error',
      message: 'Storage configuration error',
      details: config,
    };
  }

  static printStatus(): void {
    const status = this.getStorageStatus();
    
  }
}

// Configuration checking is now done asynchronously after server startup
// to avoid blocking deployment health checks