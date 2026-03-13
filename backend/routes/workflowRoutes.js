const express = require('express');
const router = express.Router();
const { triggerTask } = require('../workflow-engine/workflowEngine');

// Trigger workflow
router.post('/trigger', (req, res) => {
  const { taskName } = req.body;
  triggerTask(taskName || 'default-task');
  res.json({ status: 'success', task: taskName });
});

module.exports = router;
