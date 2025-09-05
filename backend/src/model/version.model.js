const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  createAT: { type: String },
  fileUrl: { type: String, required: true },
  versionCode: { type: String, required: true },
  versionName: { type: String },
  note: { type: String },
  fileSize: { type: Number },
  sha256: {type: String}
}, { 
  timestamps: true,
  collection: 'versionApk'
});

module.exports = mongoose.model('VersionApk', versionSchema);