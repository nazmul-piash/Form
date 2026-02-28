import express from 'express';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
} from '../controllers/formController.js';
import { generatePdf } from '../controllers/pdfController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getForms);
router.get('/:id', getFormById);
router.get('/:id/pdf', generatePdf);
router.post('/', createForm);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);

export default router;
