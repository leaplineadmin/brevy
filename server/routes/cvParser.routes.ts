import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractTextFromFile } from '../utils/fileParser';
import { parseCVWithAI } from '../services/cvParser.service';
import rateLimit from 'express-rate-limit';
import { validateAndSanitizeCvData } from '../utils/cvValidation';

const router = Router();

// Configuration de Multer pour l'upload (ESM-safe, pas de __dirname)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Le dossier uploads est créé au démarrage (voir server/index.ts)
    // Utiliser process.cwd() pour rester compatible ESM en production
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      // noop: si création échoue, laisser Multer renvoyer une erreur via cb
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez PDF ou Word.'));
    }
  }
});

/**
 * POST /api/cv/parse-upload
 * Upload et analyse d'un CV
 */
// Limiteur de requêtes pour l'upload de CV
const cvUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Trop de tentatives d'upload. Veuillez réessayer dans 15 minutes."
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit dépassé pour l'IP: ${req.ip}`);
    return res.status(429).json({ success: false, error: "Trop de tentatives d'upload. Veuillez réessayer dans 15 minutes." });
  }
});

// Middleware pour gérer les erreurs de Multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Le fichier est trop volumineux (max 5 MB).'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message || 'Erreur lors de l\'upload du fichier.'
    });
  }
  if (err) {
    // Erreur personnalisée (par exemple du fileFilter)
    return res.status(400).json({
      success: false,
      error: err.message || 'Erreur lors de l\'upload du fichier.'
    });
  }
  next();
};

router.post('/parse-upload', cvUploadLimiter, upload.single('cvFile'), handleMulterError, async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier uploadé'
      });
    }


    // 1. Extraire le texte du fichier
    const cvText = await extractTextFromFile(req.file.path, req.file.mimetype);
    
    if (!cvText || cvText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'extraire le texte du fichier'
      });
    }

    // 2. Analyser avec OpenAI
    const parsedData = await parseCVWithAI(cvText);
    // 2b. Valider et nettoyer la sortie IA
    let sanitizedData;
    try {
      sanitizedData = validateAndSanitizeCvData(parsedData, cvText, req.ip);
    } catch (validationError: any) {
      // Les erreurs de sécurité sont renvoyées avec un code 400 (Bad Request) plutôt que 500
      if (validationError.message.includes('suspect') || validationError.message.includes('potentiellement dangereux') || validationError.message.includes('invalides')) {
        return res.status(400).json({
          success: false,
          error: 'Impossible de lire le fichier. Assurez-vous qu\'il s\'agit d\'un CV valide.'
        });
      }
      // Re-lancer l'erreur pour qu'elle soit catchée par le bloc principal
      throw validationError;
    }

    // 3. Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // 4. Retourner les données structurées
    res.json({
      success: true,
      data: sanitizedData
    });

  } catch (error: any) {
    // Log l'erreur complète pour le debugging côté serveur
    console.error('❌ [CV PARSER] Erreur lors du parsing du CV:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      file: req.file ? req.file.originalname : 'N/A',
      ip: req.ip
    });
    
    // Nettoyer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('❌ Erreur lors de la suppression du fichier:', unlinkError);
      }
    }

    // Retourne un message convivial (pas de détails techniques)
    let friendlyMessage = 'Une erreur est survenue. Veuillez réessayer.';
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('Service temporairement indisponible')) {
      friendlyMessage = errorMessage; // Garde le message convivial du service
    } else if (errorMessage.includes('Impossible de se connecter')) {
      friendlyMessage = errorMessage; // Garde le message convivial du service
    } else if (errorMessage.includes('Format de fichier non supporté')) {
      friendlyMessage = 'Impossible de lire le fichier. Assurez-vous qu\'il s\'agit d\'un CV valide.';
    } else if (errorMessage.includes('Impossible d\'extraire le texte')) {
      friendlyMessage = 'Impossible de lire le fichier. Assurez-vous qu\'il s\'agit d\'un CV valide.';
    }

    // S'assurer qu'une réponse n'a pas déjà été envoyée
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: friendlyMessage
      });
    }
  }
});

export default router;
