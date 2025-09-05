const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  volume: Number,
  threshold: Number,
  brightness: Number,
}, { _id: false });

const performanceSchema = new mongoose.Schema({
  cpu: Number,
  ram: Number,
  temp: Number,
  rom: Number,
}, { _id: false });

const deviceSchema = new mongoose.Schema({
  deviceCode: { type: String, unique: true, required: true },
  status: { type: Number, enum: [0, 1], default: 0 },
  lastConnected: { type: Date, default: null },
  location: { type: String },
  version: { type: String },
  ipAddress: {type: String },
  config: configSchema,
  lastPerformance: performanceSchema,
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
