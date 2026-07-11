import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUpdateStudents,
  importCSV,
  exportCSV,
  getDistinctDepartments,
} from '../controllers/studentController';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all student routes
router.use(authenticateJWT);

router.get('/', getStudents);
router.get('/departments', getDistinctDepartments);
router.get('/export', requireRole(['Admin', 'Editor']), exportCSV);
router.patch('/bulk', requireRole(['Admin', 'Editor', 'Marker']), bulkUpdateStudents);
router.post('/import', requireRole(['Admin', 'Editor']), importCSV);
router.get('/:id', getStudentById);

router.post('/', requireRole(['Admin', 'Editor']), createStudent);
router.patch('/:id', updateStudent); // Markers and Editors can update, controller applies specific key restrictions
router.delete('/:id', requireRole(['Admin', 'Editor']), deleteStudent);

export default router;
