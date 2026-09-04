import { Router } from 'express';
import { uploadAttachment, deleteAttachment } from '../../controllers/attachment.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer storage
const uploadDir = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, Word documents, and text files are allowed.'));
    }
  }
});

router.use(requireAuth);

router.post('/', upload.single('file'), uploadAttachment);
router.delete('/:id', deleteAttachment);

export default router;
