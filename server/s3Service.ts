import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string; // Pour les fournisseurs S3 compatibles
}

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private isConfigured: boolean = false;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    
    // Set AWS_REGION env var if not present to avoid deployment warnings
    if (!process.env.AWS_REGION && !process.env.S3_REGION) {
      process.env.AWS_REGION = 'us-east-1';
    }
    
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Set default region to avoid deployment warnings
      const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
      const config: any = {
        region: region,
      };

      // Configuration des credentials - priorité aux variables Scaleway
      const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
      
      if (accessKey && secretKey) {
        config.credentials = {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        };
      }

      // Support pour les endpoints personnalisés (Scaleway, DigitalOcean, etc.)
      if (process.env.S3_ENDPOINT) {
        config.endpoint = process.env.S3_ENDPOINT;
        config.forcePathStyle = true; // Nécessaire pour Scaleway et autres fournisseurs
      }

      this.s3Client = new S3Client(config);
      this.isConfigured = !!(this.bucketName && accessKey && secretKey);
      
      if (this.isConfigured) {
      }
    } catch (error) {
      console.error('Error initializing S3 client:', error);
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload une image vers S3
   * @param file - Le fichier à uploader (Buffer ou Stream)
   * @param originalName - Le nom original du fichier
   * @param userId - L'ID de l'utilisateur (pour organiser les fichiers)
   * @returns Promise<string> - L'URL de l'image uploadée
   */
  async uploadImage(file: Buffer, originalName: string, userId: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('S3 service not configured. Check your environment variables.');
    }

    try {
      // Générer un nom unique pour le fichier
      const fileExtension = originalName.split('.').pop()?.toLowerCase();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const s3Key = `photos/${uniqueFileName}`; // Structure simplifiée pour Scaleway

      // Déterminer le type MIME
      const mimeType = this.getMimeType(fileExtension || '');

      // Créer la commande d'upload avec ACL public-read pour Scaleway
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000', // Cache 1 an
        ACL: 'public-read', // ACL publique pour accès direct
        Metadata: {
          'uploaded-by': userId,
          'original-name': originalName,
          'upload-date': new Date().toISOString(),
        },
      });

      // Uploader le fichier
      const result = await this.s3Client.send(uploadCommand);
      
      // Construire l'URL publique
      const imageUrl = this.constructPublicUrl(s3Key);
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload pour les gros fichiers avec suivi de progression
   */
  async uploadLargeImage(file: Buffer, originalName: string, userId: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Service S3 non configuré');
    }

    try {
      const fileExtension = originalName.split('.').pop()?.toLowerCase();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const s3Key = `photos/${uniqueFileName}`;
      const mimeType = this.getMimeType(fileExtension || '');

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file,
          ContentType: mimeType,
          CacheControl: 'max-age=31536000',
          ACL: 'public-read', // ACL publique pour accès direct
          Metadata: {
            'uploaded-by': userId,
            'original-name': originalName,
            'upload-date': new Date().toISOString(),
          },
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB par partie
        leavePartsOnError: false,
      });

      const result = await upload.done();
      const imageUrl = this.constructPublicUrl(s3Key);
      
      return imageUrl;
    } catch (error) {
      console.error('Error during multipart upload to S3:', error);
      throw new Error(`Multipart S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Supprime une image de S3
   * @param imageUrl - L'URL de l'image à supprimer
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Service S3 non configuré');
    }

    try {
      // Extraire la clé S3 de l'URL
      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      
      if (!s3Key) {
        throw new Error('Impossible d\'extraire la clé S3 de l\'URL');
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Génère une URL signée pour l'accès temporaire (si nécessaire)
   */
  async generateSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    // Implementation pour URL signée si nécessaire
    // Pour l'instant, on utilise des URLs publiques
    return this.constructPublicUrl(s3Key);
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private constructPublicUrl(s3Key: string): string {
    if (process.env.S3_ENDPOINT) {
      // Pour Scaleway et autres fournisseurs S3 compatibles
      // Format spécifique Scaleway : https://bucket-name.s3.region.scw.cloud/
      if (process.env.S3_ENDPOINT.includes('scw.cloud')) {
        // Construction d'URL optimisée pour Scaleway
        const region = process.env.S3_REGION || 'nl-ams';
        return `https://${this.bucketName}.s3.${region}.scw.cloud/${s3Key}`;
      } else {
        // Pour les autres fournisseurs S3 compatibles
        const endpoint = process.env.S3_ENDPOINT.replace(/\/+$/, '');
        return `${endpoint}/${this.bucketName}/${s3Key}`;
      }
    } else {
      // Pour AWS S3 standard
      const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    }
  }

  private extractS3KeyFromUrl(url: string): string | null {
    try {
      if (process.env.S3_ENDPOINT) {
        // Pour Scaleway et autres fournisseurs S3 compatibles
        if (process.env.S3_ENDPOINT.includes('scw.cloud')) {
          // Format Scaleway : https://bucket-name.s3.region.scw.cloud/photos/filename
          const region = process.env.S3_REGION || 'nl-ams';
          const prefix = `https://${this.bucketName}.s3.${region}.scw.cloud/`;
          if (url.startsWith(prefix)) {
            return url.substring(prefix.length);
          }
        } else {
          // Pour les autres endpoints personnalisés
          const endpoint = process.env.S3_ENDPOINT.replace(/\/+$/, '');
          const prefix = `${endpoint}/${this.bucketName}/`;
          if (url.startsWith(prefix)) {
            return url.substring(prefix.length);
          }
        }
      } else {
        // Pour AWS S3 standard
        const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
        const prefix = `https://${this.bucketName}.s3.${region}.amazonaws.com/`;
        if (url.startsWith(prefix)) {
          return url.substring(prefix.length);
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting S3 key:', error);
      return null;
    }
  }
}

// Instance singleton
export const s3Service = new S3Service();