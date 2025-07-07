const mongoose = require('mongoose');

const deviceLogSchema = new mongoose.Schema({
  deviceCode: { type: String, required: true },
  numberCheckIn: { type: int },
  numberCheckOut: { type: int },
  numberError: { type: int },
  numberEnroll: { type: int },
}, { timestamps: true });

module.exports = mongoose.model('DeviceLog', deviceLogSchema);
