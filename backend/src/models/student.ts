import mongoose, { Schema } from 'mongoose';

const StudentSchema = new Schema({
  name: { type: String, required: true },
  admissionNumber: { type: String, required: true, unique: true },
  mobileNumber: { type: String },
  department: { type: String, required: true },
  year: { type: Number, default: 1 }, // e.g. 1, 2, 3, 4, 5
  hostel: { type: String },
  contactStatus: {
    type: String,
    enum: ['Contacted', 'Not Contacted', 'Follow-up Required'],
    default: 'Not Contacted',
  },
  supportStatus: {
    type: String,
    enum: ['Fully in our favour', 'Leaning towards us', 'Dicey', 'Against us', 'Unknown'],
    default: 'Unknown',
  },
  voteStatus: {
    type: String,
    enum: ['Voted', 'Not Voted'],
    default: 'Not Voted',
  },
  probabilityScore: { type: Number, default: 30 }, // default Unknown -> 30%
  influenceScore: { type: Number, default: 0 },
  assignedVolunteer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  remarks: { type: String, default: '' },
  followUpDate: { type: Date, default: null },
  lastContactDate: { type: Date, default: null },
  votedAt: { type: Date, default: null },
  votedMarkedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  // Influence Checklist
  isCR: { type: Boolean, default: false },
  isClubLeader: { type: Boolean, default: false },
  isHostelRep: { type: Boolean, default: false },
  isSportsCaptain: { type: Boolean, default: false },
  isEventOrganizer: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  admissionYear: { type: Number },
  passOutYear: { type: Number },
  degreeType: { type: String, enum: ['U', 'I'], default: 'U' },
}, { timestamps: true });

// Auto calculate probabilityScore and influenceScore on save
StudentSchema.pre('save', function (next) {
  // Ingest Year & Degree Type from admission number e.g. U23MA018
  if (this.admissionNumber) {
    const numStr = this.admissionNumber.trim();
    const typeChar = numStr.charAt(0).toUpperCase();
    this.degreeType = typeChar === 'I' ? 'I' : 'U';

    const yearPart = parseInt(numStr.substring(1, 3));
    if (!isNaN(yearPart)) {
      this.admissionYear = 2000 + yearPart;
      const duration = this.degreeType === 'I' ? 5 : 4;
      this.passOutYear = this.admissionYear + duration;
      
      // Calculate academic year relative to current reference year (2026)
      const currentRefYear = 2026;
      let calculatedYear = currentRefYear - this.admissionYear + 1;
      if (calculatedYear < 1) calculatedYear = 1;
      if (calculatedYear > duration) calculatedYear = duration;
      this.year = calculatedYear;
    }
  }

  // Probability Score mapping
  if (this.supportStatus === 'Fully in our favour') {
    this.probabilityScore = 95;
  } else if (this.supportStatus === 'Leaning towards us') {
    this.probabilityScore = 75;
  } else if (this.supportStatus === 'Dicey') {
    this.probabilityScore = 50;
  } else if (this.supportStatus === 'Against us') {
    this.probabilityScore = 5;
  } else {
    this.probabilityScore = 30; // Unknown
  }

  // Influence Score calculation
  let inf = 0;
  if (this.isCR) inf += 20;
  if (this.isClubLeader) inf += 20;
  if (this.isHostelRep) inf += 20;
  if (this.isSportsCaptain) inf += 15;
  if (this.isEventOrganizer) inf += 15;
  if (this.isPopular) inf += 10;
  this.influenceScore = inf;

  next();
});

export const Student = mongoose.model('Student', StudentSchema);
export default Student;
