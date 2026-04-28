const mongoose = require('mongoose');

const evaluationCriteriaSchema = new mongoose.Schema({
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  workbookActivitiesMax: {
    type: Number,
    required: true,
    default: 26
  },
  trainingHoursMax: {
    type: Number,
    required: true,
    default: 30
  },
  workbookMultiplier: {
    type: Number,
    required: true,
    default: 3.85
  },
  trainingMultiplier: {
    type: Number,
    required: true,
    default: 3.33
  },
  attendanceDaysMax: {
    type: Number,
    required: true,
    default: 25
  },
  performanceMax: {
    type: Number,
    required: true,
    default: 100
  },
  presentationMax: {
    type: Number,
    required: true,
    default: 100
  }
}, {
  timestamps: true
});

// Ensure one criteria per clinic
evaluationCriteriaSchema.index({ clinic: 1 }, { unique: true });

module.exports = mongoose.model('EvaluationCriteria', evaluationCriteriaSchema);
