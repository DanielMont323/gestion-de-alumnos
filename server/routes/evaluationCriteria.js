const express = require('express');
const EvaluationCriteria = require('../models/EvaluationCriteria');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get evaluation criteria for a clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    let criteria = await EvaluationCriteria.findOne({ clinic: clinicId });
    
    // If no criteria exist for this clinic, create default ones
    if (!criteria) {
      criteria = new EvaluationCriteria({
        clinic: clinicId,
        workbookActivitiesMax: 26,
        trainingHoursMax: 30,
        workbookMultiplier: parseFloat((100 / 26).toFixed(2)),
        trainingMultiplier: parseFloat((100 / 30).toFixed(2)),
        attendanceDaysMax: 25,
        performanceMax: 100,
        presentationMax: 100
      });
      await criteria.save();
    }
    
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update evaluation criteria for a clinic
router.put('/clinic/:clinicId', [
  body('workbookActivitiesMax').isInt({ min: 1, max: 100 }).withMessage('Workbook activities max must be between 1 and 100'),
  body('trainingHoursMax').isInt({ min: 1, max: 200 }).withMessage('Training hours max must be between 1 and 200'),
  body('attendanceDaysMax').isInt({ min: 1, max: 365 }).withMessage('Attendance days max must be between 1 and 365'),
  body('performanceMax').isInt({ min: 1, max: 100 }).withMessage('Performance max must be between 1 and 100'),
  body('presentationMax').isInt({ min: 1, max: 100 }).withMessage('Presentation max must be between 1 and 100'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clinicId } = req.params;
    const { 
      workbookActivitiesMax, 
      trainingHoursMax, 
      attendanceDaysMax,
      performanceMax,
      presentationMax 
    } = req.body;
    
    // Calculate multipliers
    const workbookMultiplier = parseFloat((100 / workbookActivitiesMax).toFixed(2));
    const trainingMultiplier = parseFloat((100 / trainingHoursMax).toFixed(2));
    
    let criteria = await EvaluationCriteria.findOne({ clinic: clinicId });
    
    if (criteria) {
      // Update existing criteria
      criteria.workbookActivitiesMax = workbookActivitiesMax;
      criteria.trainingHoursMax = trainingHoursMax;
      criteria.workbookMultiplier = workbookMultiplier;
      criteria.trainingMultiplier = trainingMultiplier;
      criteria.attendanceDaysMax = attendanceDaysMax;
      criteria.performanceMax = performanceMax;
      criteria.presentationMax = presentationMax;
      await criteria.save();
    } else {
      // Create new criteria
      criteria = new EvaluationCriteria({
        clinic: clinicId,
        workbookActivitiesMax,
        trainingHoursMax,
        workbookMultiplier,
        trainingMultiplier,
        attendanceDaysMax,
        performanceMax,
        presentationMax
      });
      await criteria.save();
    }
    
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
