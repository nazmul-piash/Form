import express from 'express';
import { upload, uploadFile } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, upload.single('file'), uploadFile);

export default router;
