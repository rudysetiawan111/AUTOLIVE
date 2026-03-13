const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const channelsRoutes = require('./routes/channelsRoutes');
const videosRoutes = require('./routes/videosRoutes');
const viralRoutes = require('./routes/viralRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');

app.use(bodyParser.json());

// API routes
app.use('/api/channels', channelsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/viral', viralRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('AUTOLIVE Backend Running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
