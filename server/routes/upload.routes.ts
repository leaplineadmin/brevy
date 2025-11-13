import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import multer from 'multer';
import { s3Service } from '../s3Service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
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

// Upload image
router.post('/image', requireAuth, upload.single('image'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const userId = req.user.id;
  const fileExtension = path.extname(req.file.originalname);
  const fileName = `${userId}/${uuidv4()}${fileExtension}`;

  try {
    const uploadResult = await s3Service.uploadFile(req.file.buffer, fileName, req.file.mimetype);
    
    res.json({
      success: true,
      url: uploadResult.Location,
      key: uploadResult.Key
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: "Upload failed" });
  }
}));

// Delete image
router.delete('/image', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ message: "Image key is required" });
  }

  try {
    await s3Service.deleteFile(key);
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: "Delete failed" });
  }
}));

export default router;
