const mongoose = require('mongoose');

const deviceLogSchema = new mongoose.Schema({
  accessDate: { type: String, required: true },
  accessTime: { type: String, required: true },
  accessType: { type: String, required: true },
  age: { type: Number },
  cardNo: { type: String },
  compId: { type: String },
  errorCode: { type: String },
  eventCode: { type: String },
  eventId: { type: String, required: true },
  eventName: { type: String },
  scoreMatch: { type: Number }
  // faceFeature: { type: String },
  // faceImage: { type: String },
  // faceImageBase64: { type: String }
}, { 
  timestamps: true,
  collection: 'deviceLogs'
});

module.exports = mongoose.model('DeviceLog', deviceLogSchema);
