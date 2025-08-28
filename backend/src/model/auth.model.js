const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  displayName: { type: String },
  role: { type: String, default: "user" },
}, { 
  timestamps: true,
  collection: 'auth'
});

module.exports = mongoose.model('Auth', authSchema);