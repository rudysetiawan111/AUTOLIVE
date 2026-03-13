const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const Database = require('better-sqlite3'); // High-performance SQLite driver

// Import Services & Engines
const { AutomationEngine } = require('./engines/automationEngine');
const { ViralScanner } = require('./services/viralScanner');

// Import Routes
const channelRoutes = require('./routes/channels');
const videoRoutes = require('./routes/videos');
const viralRoutes = require('./routes/viral');
const workflowRoutes = require('./routes/workflows');
const uploadRoutes = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Database Connection (SQLite)
const db = new Database('autolive.db', { verbose: console.log });
db.pragma('journal_mode = WAL'); // Performance optimization for concurrent access
console.log('✅ Connected to SQLite database.');

// 3. Initialize API Routes
app.use('/api/channels', channelRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/viral', viralRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'Live', platform: 'AUTOLIVE' }));

// 4. Initialize Automation Engine
// Designed to handle up to 50 channels simultaneously
const engine = new AutomationEngine(db);
engine.initialize().then(() => {
    console.log('🤖 Automation Engine initialized (Ready for 50 channels)');
}).catch(err => console.error('Failed to start Automation Engine:', err));

// 5. Start Viral Scanning Scheduler (Runs every 10 minutes)
const scanner = new ViralScanner(db);
cron.schedule('*/10 * * * *', async () => {
    console.log('🔍 [Scheduler] Starting viral video scan...');
    try {
        await scanner.scanAllSources();
        console.log('✨ [Scheduler] Viral scan complete.');
    } catch (err) {
        console.error('❌ [Scheduler] Viral scan failed:', err);
    }
});

// 6. Start Server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 AUTOLIVE Backend running on http://localhost:${PORT}`);
    });
}

// Export for testing or mounting
module.exports = app;
