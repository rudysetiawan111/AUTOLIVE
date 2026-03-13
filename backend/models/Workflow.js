const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'running', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
