const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  group: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  totalGroupDays: {
    type: Number,
    default: 25
  },
  attendanceDays: {
    type: Number,
    default: 0
  },
  performance: {
    type: Number,
    default: 0
  },
  presentation: {
    type: Number,
    default: 0
  },
  workbookProgress: {
    type: Number,
    default: 0
  },
  trainingHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add virtual to calculate attendance percentage correctly
studentSchema.virtual('attendancePercentageCalculated').get(function() {
  if (!this.totalGroupDays || this.totalGroupDays === 0) return 0;
  return Math.round((this.attendanceDays / this.totalGroupDays) * 100);
});

// Override the default attendancePercentage to use the correct calculation
studentSchema.pre('save', function(next) {
  if (!this.totalGroupDays || this.totalGroupDays === 0) {
    this.totalGroupDays = 25; // Default to 25 days
  }
  this.attendancePercentage = Math.round((this.attendanceDays / this.totalGroupDays) * 100);
  next();
});

module.exports = mongoose.model('Student', studentSchema);
