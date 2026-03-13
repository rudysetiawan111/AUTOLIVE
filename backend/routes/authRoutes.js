const express = require('express');
const router = express.Router();

// Dummy login / auth endpoint
router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  res.json({ status: 'success', username, token: 'dummy-token-12345' });
});

module.exports = router;
