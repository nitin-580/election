import { Response } from 'express';
import Student from '../models/student';
import User from '../models/user';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAction } from '../utils/auditLogger';

// GET /api/students - pagination, search, filter, sort
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;

    // Filters
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) filter.year = parseInt(req.query.year as string);
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.contactStatus) filter.contactStatus = req.query.contactStatus;
    if (req.query.supportStatus) filter.supportStatus = req.query.supportStatus;
    if (req.query.voteStatus) filter.voteStatus = req.query.voteStatus;
    if (req.query.admissionYear) filter.admissionYear = parseInt(req.query.admissionYear as string);
    if (req.query.passOutYear) filter.passOutYear = parseInt(req.query.passOutYear as string);
    if (req.query.degreeType) filter.degreeType = req.query.degreeType;
    if (req.query.assignedVolunteer) {
      filter.assignedVolunteer = req.query.assignedVolunteer === 'null' ? null : req.query.assignedVolunteer;
    }

    // Search (by name or admission number or mobile number)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(filter);
    
    // Virtual scrolling optimization: if limit is -1, return all records (e.g. for client side virtual table)
    const actualLimit = limit === -1 ? total : limit;
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const students = await Student.find(filter)
      .populate('assignedVolunteer', 'username role')
      .populate('votedMarkedBy', 'username role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(actualLimit);

    return res.json({
      students,
      page,
      limit: actualLimit,
      total,
      pages: limit === -1 ? 1 : Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getStudents error:', error);
    return res.status(500).json({ message: 'Error retrieving students' });
  }
};

// GET /api/students/:id
export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('assignedVolunteer', 'username role')
      .populate('votedMarkedBy', 'username role');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.json(student);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving student' });
  }
};

// POST /api/students - create new student
export const createStudent = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'Admin' && req.user?.role !== 'Editor') {
    return res.status(403).json({ message: 'Only Editors and Admins are allowed to add new students.' });
  }

  try {
    const studentData = req.body;
    
    // Check if admission number exists
    const existing = await Student.findOne({ admissionNumber: studentData.admissionNumber });
    if (existing) {
      return res.status(400).json({ message: 'Student with this admission number already exists' });
    }

    const student = new Student(studentData);
    await student.save();

    if (req.user) {
      await logAction(req.user.id, 'CREATE_STUDENT', {
        admissionNumber: student.admissionNumber,
        name: student.name,
      });
    }

    return res.status(201).json(student);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creating student' });
  }
};

// PATCH /api/students/:id - update student
export const updateStudent = async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'Watcher') {
    return res.status(403).json({ message: 'Watchers are read-only and cannot modify records.' });
  }

  const updates = req.body;

  if (req.user?.role === 'Marker') {
    const allowedKeys = ['mobileNumber', 'voteStatus', 'remarks', 'contactStatus'];
    const attemptedKeys = Object.keys(updates);
    const hasViolation = attemptedKeys.some(k => !allowedKeys.includes(k));
    if (hasViolation) {
      return res.status(403).json({ message: 'Markers are only allowed to update mobile numbers, contact status, and vote status.' });
    }
  }

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Capture changes for audit logs
    const changes: any = {};
    for (const key of Object.keys(updates)) {
      if (updates[key] !== (student as any)[key]) {
        changes[key] = { from: (student as any)[key], to: updates[key] };
      }
    }

    // Special handling for Vote Status
    if (updates.voteStatus && updates.voteStatus !== student.voteStatus) {
      if (updates.voteStatus === 'Voted') {
        student.voteStatus = 'Voted';
        student.votedAt = new Date();
        student.votedMarkedBy = req.user ? (req.user.id as any) : null;
      } else {
        student.voteStatus = 'Not Voted';
        student.votedAt = null;
        student.votedMarkedBy = null;
      }
    }

    // Assign updates
    Object.assign(student, updates);
    await student.save();

    if (req.user && Object.keys(changes).length > 0) {
      await logAction(req.user.id, 'UPDATE_STUDENT', {
        studentId: student._id,
        name: student.name,
        changes,
      });
    }

    const updatedStudent = await Student.findById(student._id)
      .populate('assignedVolunteer', 'username role')
      .populate('votedMarkedBy', 'username role');

    return res.json(updatedStudent);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error updating student' });
  }
};

// DELETE /api/students/:id
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'Admin' && req.user?.role !== 'Editor') {
    return res.status(403).json({ message: 'Only Editors and Admins are allowed to delete student records.' });
  }

  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user) {
      await logAction(req.user.id, 'DELETE_STUDENT', {
        admissionNumber: student.admissionNumber,
        name: student.name,
      });
    }

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting student' });
  }
};

// PATCH /api/students/bulk - bulk update status or volunteer assignment
export const bulkUpdateStudents = async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'Watcher') {
    return res.status(403).json({ message: 'Watchers are read-only and cannot perform bulk updates.' });
  }

  const { studentIds, updates } = req.body;

  if (req.user?.role === 'Marker') {
    const allowedKeys = ['voteStatus', 'contactStatus'];
    const attemptedKeys = Object.keys(updates);
    const hasViolation = attemptedKeys.some(k => !allowedKeys.includes(k));
    if (hasViolation) {
      return res.status(403).json({ message: 'Markers are only allowed to bulk update contact status and vote status.' });
    }
  }

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty studentIds array' });
  }

  try {
    const query: any = { _id: { $in: studentIds } };
    
    // If setting voteStatus
    if (updates.voteStatus) {
      if (updates.voteStatus === 'Voted') {
        updates.votedAt = new Date();
        updates.votedMarkedBy = req.user ? req.user.id : null;
      } else {
        updates.votedAt = null;
        updates.votedMarkedBy = null;
      }
    }

    // In mongoose, using updateMany won't trigger pre-save hooks (meaning probability/influence won't automatically recalculate)
    // To ensure they recalculate, we can update them in a loop, or update keys and trigger recalculations, or we can manually map updates.
    // Given 4000 students, bulk update is usually < 100 at a time. Let's do it in a loop so pre-save hooks are executed!
    const students = await Student.find(query);
    for (const student of students) {
      if (updates.voteStatus && updates.voteStatus !== student.voteStatus) {
        if (updates.voteStatus === 'Voted') {
          student.voteStatus = 'Voted';
          student.votedAt = updates.votedAt;
          student.votedMarkedBy = updates.votedMarkedBy;
        } else {
          student.voteStatus = 'Not Voted';
          student.votedAt = null;
          student.votedMarkedBy = null;
        }
      }
      
      // Update other fields
      if (updates.contactStatus) student.contactStatus = updates.contactStatus;
      if (updates.supportStatus) student.supportStatus = updates.supportStatus;
      if (updates.assignedVolunteer !== undefined) {
        const val = updates.assignedVolunteer;
        student.assignedVolunteer = (!val || val === 'null' || val === 'undefined') ? null : val;
      }
      
      await student.save();
    }

    if (req.user) {
      await logAction(req.user.id, 'BULK_UPDATE_STUDENTS', {
        count: studentIds.length,
        updates,
      });
    }

    return res.json({ message: `Successfully updated ${students.length} students` });
  } catch (error: any) {
    console.error('Error performing bulk update:', error);
    return res.status(400).json({ message: error.message || 'Error performing bulk update' });
  }
};

// POST /api/students/import - CSV Import
export const importCSV = async (req: AuthRequest, res: Response) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ message: 'csvText body parameter is required' });
  }

  try {
    // Basic CSV Parser helper
    const parseCSV = (text: string) => {
      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const results: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // handle commas inside quotes (simple regex matcher)
        const values: string[] = [];
        let insideQuote = false;
        let entry = '';
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(entry.trim());
            entry = '';
          } else {
            entry += char;
          }
        }
        values.push(entry.trim());

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] !== undefined ? values[index].replace(/^"|"$/g, '') : '';
        });
        results.push(row);
      }
      return results;
    };

    const rows = parseCSV(csvText);
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      if (!row.name || !row.admissionNumber || !row.department || !row.year) {
        continue; // skip incomplete rows
      }

      // Check for volunteer assignment by username if provided
      let volunteerId = null;
      if (row.assignedVolunteer) {
        const vol = await User.findOne({ username: row.assignedVolunteer, role: 'Volunteer' });
        if (vol) volunteerId = vol._id;
      }

      const updateData: any = {
        name: row.name,
        mobileNumber: row.mobileNumber || '',
        department: row.department,
        year: parseInt(row.year) || 1,
        hostel: row.hostel || '',
        contactStatus: row.contactStatus || 'Not Contacted',
        supportStatus: row.supportStatus || 'Unknown',
        voteStatus: row.voteStatus || 'Not Voted',
        remarks: row.remarks || '',
        assignedVolunteer: volunteerId,
        followUpDate: row.followUpDate ? new Date(row.followUpDate) : null,
        lastContactDate: row.lastContactDate ? new Date(row.lastContactDate) : null,
        isCR: row.isCR === 'true' || row.isCR === '1',
        isClubLeader: row.isClubLeader === 'true' || row.isClubLeader === '1',
        isHostelRep: row.isHostelRep === 'true' || row.isHostelRep === '1',
        isSportsCaptain: row.isSportsCaptain === 'true' || row.isSportsCaptain === '1',
        isEventOrganizer: row.isEventOrganizer === 'true' || row.isEventOrganizer === '1',
        isPopular: row.isPopular === 'true' || row.isPopular === '1',
      };

      const existing = await Student.findOne({ admissionNumber: row.admissionNumber });
      if (existing) {
        Object.assign(existing, updateData);
        await existing.save();
        updatedCount++;
      } else {
        updateData.admissionNumber = row.admissionNumber;
        const student = new Student(updateData);
        await student.save();
        createdCount++;
      }
    }

    if (req.user) {
      await logAction(req.user.id, 'IMPORT_CSV', {
        created: createdCount,
        updated: updatedCount,
      });
    }

    return res.json({
      message: `CSV import complete. Created: ${createdCount}, Updated: ${updatedCount}`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ message: error.message || 'Error importing CSV data' });
  }
};

// GET /api/students/export - CSV Export
export const exportCSV = async (req: AuthRequest, res: Response) => {
  try {
    // Retrieve students matching filters (similar to getStudents but without pagination)
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) filter.year = parseInt(req.query.year as string);
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.contactStatus) filter.contactStatus = req.query.contactStatus;
    if (req.query.supportStatus) filter.supportStatus = req.query.supportStatus;
    if (req.query.voteStatus) filter.voteStatus = req.query.voteStatus;
    if (req.query.admissionYear) filter.admissionYear = parseInt(req.query.admissionYear as string);
    if (req.query.passOutYear) filter.passOutYear = parseInt(req.query.passOutYear as string);
    if (req.query.degreeType) filter.degreeType = req.query.degreeType;

    const students = await Student.find(filter).populate('assignedVolunteer', 'username');

    // Build CSV content
    const headers = [
      'name',
      'admissionNumber',
      'mobileNumber',
      'department',
      'year',
      'hostel',
      'contactStatus',
      'supportStatus',
      'voteStatus',
      'probabilityScore',
      'influenceScore',
      'assignedVolunteer',
      'remarks',
      'isCR',
      'isClubLeader',
      'isHostelRep',
      'isSportsCaptain',
      'isEventOrganizer',
      'isPopular',
    ];

    let csvContent = headers.join(',') + '\n';

    for (const s of students) {
      const row = [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.admissionNumber}"`,
        `"${s.mobileNumber || ''}"`,
        `"${s.department}"`,
        s.year,
        `"${s.hostel || ''}"`,
        `"${s.contactStatus}"`,
        `"${s.supportStatus}"`,
        `"${s.voteStatus}"`,
        s.probabilityScore,
        s.influenceScore,
        s.assignedVolunteer ? `"${(s.assignedVolunteer as any).username}"` : '""',
        `"${(s.remarks || '').replace(/"/g, '""')}"`,
        s.isCR,
        s.isClubLeader,
        s.isHostelRep,
        s.isSportsCaptain,
        s.isEventOrganizer,
        s.isPopular,
      ];
      csvContent += row.join(',') + '\n';
    }

    res.header('Content-Type', 'text/csv');
    res.attachment('students_export.csv');
    return res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ message: 'Error exporting CSV' });
  }
};

// GET /api/students/departments - get distinct departments
export const getDistinctDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Student.distinct('department');
    return res.json(depts);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving departments' });
  }
};
