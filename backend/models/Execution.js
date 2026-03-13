const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema({
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  status: { type: String, enum: ['pending', 'running', 'completed'], default: 'pending' },
  startedAt: Date,
  finishedAt: Date
});

module.exports = mongoose.model('Execution', ExecutionSchema);
