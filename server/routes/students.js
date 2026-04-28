const express = require('express');
const Student = require('../models/Student');
const Clinic = require('../models/Clinic');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all students with optional filtering
router.get('/', async (req, res) => {
  try {
    const { clinicId, group, search, page = 1, limit = 10 } = req.query;
    
    console.log('Students query params:', { clinicId, group, search, page, limit });
    
    let query = {};
    
    if (clinicId) query.clinic = clinicId;
    if (group) query.group = group;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    console.log('MongoDB query:', query);

    const students = await Student.find(query)
      .populate('clinic', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('clinic');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new student
router.post('/', [
  body('name').notEmpty().withMessage('Student name is required'),
  body('clinic').notEmpty().withMessage('Clinic is required'),
  body('group').notEmpty().withMessage('Group is required'),
  body('startDate').notEmpty().withMessage('Start date is required')
], async (req, res) => {
  try {
    console.log('Creating student with data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Process the start date to avoid timezone issues
    const studentData = { ...req.body };
    console.log('Original startDate from frontend:', studentData.startDate);
    console.log('Type of startDate:', typeof studentData.startDate);
    
    if (studentData.startDate) {
      // Parse date as local date, not UTC
      const dateParts = studentData.startDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2]);
      
      const startDate = new Date(year, month, day, 12, 0, 0, 0); // Local time at noon
      console.log('Created Date object:', startDate);
      console.log('Date after setting hours:', startDate.toString());
      studentData.startDate = startDate;
    }
    
    console.log('Final student data before saving:', studentData);
    const student = new Student(studentData);
    await student.save();
    console.log('Student saved successfully:', student._id);

    // Update clinic student count
    await Clinic.findByIdAndUpdate(
      req.body.clinic,
      { $inc: { totalStudents: 1 } }
    );

    const populatedStudent = await Student.findById(student._id).populate('clinic');
    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    // Process the start date to avoid timezone issues
    const studentData = { ...req.body };
    if (studentData.startDate) {
      // Parse date as local date, not UTC
      const dateParts = studentData.startDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2]);
      
      const startDate = new Date(year, month, day, 12, 0, 0, 0); // Local time at noon
      studentData.startDate = startDate;
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      studentData,
      { new: true, runValidators: true }
    ).populate('clinic');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update clinic student count
    await Clinic.findByIdAndUpdate(
      student.clinic,
      { $inc: { totalStudents: -1 } }
    );

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { group, search } = req.query;
    
    let query = { clinic: req.params.clinicId };
    
    if (group) query.group = group;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const students = await Student.find(query).sort({ name: 1 });
    res.json({
      students,
      totalPages: 1,
      currentPage: 1,
      total: students.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
