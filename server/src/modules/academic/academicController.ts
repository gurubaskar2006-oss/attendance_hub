import { Response } from 'express';
import { AcademicYear } from '../../models/AcademicYear';
import { Class } from '../../models/Class';
import { Section } from '../../models/Section';
import { Subject } from '../../models/Subject';
import { TeacherAssignment } from '../../models/TeacherAssignment';
import { User } from '../../models/User';
import { AuthRequest } from '../../middleware/auth';

/**
 * List academic years for the authenticated tenant
 */
export const getAcademicYears = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const years = await AcademicYear.find({ tenantId: req.tenantId }).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: years });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic years.', error: err.message });
  }
};

/**
 * Create an academic year
 */
export const createAcademicYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Name, startDate, and endDate are required.' });
      return;
    }

    if (isCurrent) {
      await AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
    }

    const year = await AcademicYear.create({
      tenantId: req.tenantId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: Boolean(isCurrent),
    });

    res.status(201).json({ success: true, message: 'Academic year created successfully.', data: year });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create academic year.', error: err.message });
  }
};

/**
 * Set an academic year as current
 */
export const setCurrentAcademicYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
    const year = await AcademicYear.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { isCurrent: true },
      { new: true }
    );

    if (!year) {
      res.status(404).json({ success: false, message: 'Academic year not found.' });
      return;
    }

    res.status(200).json({ success: true, message: `Academic year ${year.name} set as current.`, data: year });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to set current academic year.', error: err.message });
  }
};

/**
 * List classes with sections for the tenant
 */
export const getClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await Class.find({ tenantId: req.tenantId }).sort({ gradeLevel: 1, displayOrder: 1 });
    
    // Embed sections
    const classesWithSections = await Promise.all(
      classes.map(async (cls) => {
        const sections = await Section.find({ tenantId: req.tenantId, classId: cls._id }).sort({ name: 1 });
        return {
          ...cls.toObject(),
          sections,
        };
      })
    );

    res.status(200).json({ success: true, data: classesWithSections });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.', error: err.message });
  }
};

/**
 * Create a class
 */
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, gradeLevel, displayOrder, sections } = req.body;

    if (!name || gradeLevel === undefined) {
      res.status(400).json({ success: false, message: 'Class name and gradeLevel are required.' });
      return;
    }

    const newClass = await Class.create({
      tenantId: req.tenantId,
      name,
      gradeLevel: Number(gradeLevel),
      displayOrder: Number(displayOrder || 0),
    });

    // Optionally create initial sections (e.g. ['A', 'B'])
    if (Array.isArray(sections) && sections.length > 0) {
      for (const secName of sections) {
        await Section.create({
          tenantId: req.tenantId,
          classId: newClass._id,
          name: typeof secName === 'string' ? secName.toUpperCase() : secName.name.toUpperCase(),
        });
      }
    }

    res.status(201).json({ success: true, message: 'Class created successfully.', data: newClass });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create class.', error: err.message });
  }
};

/**
 * Create a section for a class
 */
export const createSection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, name, roomNumber, capacity } = req.body;

    if (!classId || !name) {
      res.status(400).json({ success: false, message: 'classId and section name are required.' });
      return;
    }

    const section = await Section.create({
      tenantId: req.tenantId,
      classId,
      name: name.toUpperCase().trim(),
      roomNumber,
      capacity: capacity || 45,
    });

    res.status(201).json({ success: true, message: 'Section created successfully.', data: section });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create section.', error: err.message });
  }
};

/**
 * List subjects for the tenant
 */
export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({ tenantId: req.tenantId }).sort({ name: 1 });
    res.status(200).json({ success: true, data: subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects.', error: err.message });
  }
};

/**
 * Create a subject
 */
export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, isElective, department } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, message: 'Subject name and unique code are required.' });
      return;
    }

    const subject = await Subject.create({
      tenantId: req.tenantId,
      name: name.trim(),
      code: code.toUpperCase().trim(),
      isElective: Boolean(isElective),
      department,
    });

    res.status(201).json({ success: true, message: 'Subject created successfully.', data: subject });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create subject.', error: err.message });
  }
};

/**
 * List teacher allocations for classes and sections
 */
export const getAllocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = { tenantId: req.tenantId };
    
    // If requesting user is a Teacher, return only their assignments
    if (req.user?.role === 'TEACHER') {
      query.teacherId = req.user._id;
    }

    const allocations = await TeacherAssignment.find(query)
      .populate('teacherId', 'firstName lastName email phone')
      .populate('classId', 'name gradeLevel')
      .populate('sectionId', 'name roomNumber')
      .populate('subjectId', 'name code')
      .populate('academicYearId', 'name isCurrent');

    res.status(200).json({ success: true, data: allocations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch teacher allocations.', error: err.message });
  }
};

/**
 * Assign teacher to a class/section/subject
 */
export const createAllocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacherId, academicYearId, classId, sectionId, subjectId, isClassTeacher } = req.body;

    if (!teacherId || !classId || !sectionId) {
      res.status(400).json({ success: false, message: 'teacherId, classId, and sectionId are required.' });
      return;
    }

    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await AcademicYear.findOne({ tenantId: req.tenantId, isCurrent: true });
      yearId = currentYear?._id;
    }

    // If marked as class teacher, unmark previous class teacher for this class & section
    if (isClassTeacher) {
      await TeacherAssignment.updateMany(
        { tenantId: req.tenantId, classId, sectionId, academicYearId: yearId },
        { isClassTeacher: false }
      );
    }

    const allocation = await TeacherAssignment.create({
      tenantId: req.tenantId,
      teacherId,
      academicYearId: yearId,
      classId,
      sectionId,
      subjectId: subjectId || null,
      isClassTeacher: Boolean(isClassTeacher),
    });

    const populated = await TeacherAssignment.findById(allocation._id)
      .populate('teacherId', 'firstName lastName email')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code');

    res.status(201).json({ success: true, message: 'Teacher allocation created successfully.', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create teacher allocation.', error: err.message });
  }
};

/**
 * Delete a teacher allocation
 */
export const deleteAllocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await TeacherAssignment.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Allocation not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Allocation removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete allocation.', error: err.message });
  }
};

