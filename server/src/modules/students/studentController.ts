import { Response } from 'express';
import { Student } from '../../models/Student';
import { ParentStudentRelationship } from '../../models/ParentStudentRelationship';
import { AcademicYear } from '../../models/AcademicYear';
import { AuthRequest } from '../../middleware/auth';
import { AuditLog } from '../../models/AuditLog';

/**
 * List students with pagination, search, and filtering
 */
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const search = (req.query.search as string)?.trim();
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const status = req.query.status as string;

    const query: any = { tenantId: req.tenantId };

    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;
    if (status) query.status = status;
    else query.status = { $ne: 'WITHDRAWN' }; // default show active and transferred

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('classId', 'name gradeLevel')
        .populate('sectionId', 'name')
        .populate('academicYearId', 'name isCurrent')
        .sort({ classId: 1, sectionId: 1, rollNumber: 1, firstName: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch students.', error: err.message });
  }
};

/**
 * Get single student profile with parents linked
 */
export const getStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, tenantId: req.tenantId })
      .populate('classId', 'name gradeLevel')
      .populate('sectionId', 'name roomNumber')
      .populate('academicYearId', 'name');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found in your school records.' });
      return;
    }

    // If Parent role, verify that this parent is linked to this student
    if (req.user?.role === 'PARENT') {
      const { Parent } = await import('../../models/Parent');
      const parent = await Parent.findOne({ tenantId: req.tenantId, userId: req.user._id });
      const verified = parent
        ? await ParentStudentRelationship.findOne({
            tenantId: req.tenantId,
            parentId: parent._id,
            studentId: student._id,
            isVerified: true,
          })
        : null;

      if (!verified) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not authorized to view this student profile.',
        });
        return;
      }
    }

    // Fetch linked parent records
    const relationships = await ParentStudentRelationship.find({
      tenantId: req.tenantId,
      studentId: student._id,
    }).populate({
      path: 'parentId',
      populate: { path: 'userId', select: 'firstName lastName email phone' },
    });

    res.status(200).json({
      success: true,
      data: {
        student,
        parents: relationships,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch student details.', error: err.message });
  }
};

/**
 * Create a new student
 */
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      academicYearId,
      classId,
      sectionId,
      rollNumber,
      bloodGroup,
      address,
      emergencyContact,
    } = req.body;

    if (!admissionNumber || !firstName || !lastName || !dateOfBirth || !classId || !sectionId) {
      res.status(400).json({
        success: false,
        message: 'Admission number, first name, last name, DOB, class, and section are required.',
      });
      return;
    }

    const admNo = admissionNumber.toUpperCase().trim();

    // Check duplicate admission number in this school
    const existing = await Student.findOne({ tenantId: req.tenantId, admissionNumber: admNo });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Student with admission number "${admNo}" already exists in this school.`,
      });
      return;
    }

    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
      yearId = currentYear?._id;
    }

    const student = await Student.create({
      tenantId: req.tenantId,
      admissionNumber: admNo,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender: gender || 'MALE',
      academicYearId: yearId,
      classId,
      sectionId,
      rollNumber: rollNumber?.trim(),
      bloodGroup,
      address,
      emergencyContact,
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      data: student,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create student.', error: err.message });
  }
};

/**
 * Update student profile
 */
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.tenantId; // Never permit modifying tenant

    const student = await Student.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      updateData,
      { new: true }
    );

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Student details updated successfully.',
      data: student,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update student.', error: err.message });
  }
};

/**
 * Bulk import students via JSON/CSV data
 */
export const bulkImportStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { students: rawStudents, defaultClassId, defaultSectionId } = req.body;

    if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
      res.status(400).json({ success: false, message: 'Payload must include a non-empty array of students.' });
      return;
    }

    const currentYear = await AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
    const academicYearId = currentYear?._id;

    const imported = [];
    const skipped = [];

    for (const item of rawStudents) {
      const admNo = item.admissionNumber?.toString().toUpperCase().trim();
      if (!admNo || !item.firstName || !item.lastName) {
        skipped.push({ row: item, reason: 'Missing mandatory fields (admissionNumber, firstName, lastName)' });
        continue;
      }

      // Check duplicate
      const exists = await Student.findOne({ tenantId: req.tenantId, admissionNumber: admNo });
      if (exists) {
        skipped.push({ admissionNumber: admNo, reason: 'Duplicate admission number in this school' });
        continue;
      }

      const newStudent = await Student.create({
        tenantId: req.tenantId,
        admissionNumber: admNo,
        firstName: item.firstName.trim(),
        lastName: item.lastName.trim(),
        dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : new Date('2015-01-01'),
        gender: ['MALE', 'FEMALE', 'OTHER'].includes(item.gender?.toUpperCase()) ? item.gender.toUpperCase() : 'MALE',
        academicYearId,
        classId: item.classId || defaultClassId,
        sectionId: item.sectionId || defaultSectionId,
        rollNumber: item.rollNumber?.toString().trim(),
        bloodGroup: item.bloodGroup,
        emergencyContact: {
          phone: item.parentPhone || item.phone || '',
          name: item.parentName || 'Parent',
          relationship: 'Parent',
        },
        status: 'ACTIVE',
      });

      imported.push(newStudent);
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${imported.length} students imported, ${skipped.length} skipped.`,
      data: {
        importedCount: imported.length,
        skippedCount: skipped.length,
        skipped,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Bulk import failed.', error: err.message });
  }
};

/**
 * Promote students to next class / academic year
 */
export const promoteStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentIds, targetClassId, targetSectionId, targetAcademicYearId } = req.body;

    if (!Array.isArray(studentIds) || !targetClassId || !targetSectionId) {
      res.status(400).json({
        success: false,
        message: 'studentIds, targetClassId, and targetSectionId are required for promotion.',
      });
      return;
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds }, tenantId: req.tenantId },
      {
        classId: targetClassId,
        sectionId: targetSectionId,
        ...(targetAcademicYearId && { academicYearId: targetAcademicYearId }),
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} students.`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Promotion failed.', error: err.message });
  }
};

