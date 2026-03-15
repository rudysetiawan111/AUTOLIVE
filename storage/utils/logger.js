/**
 * Storage Logger
 */

const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../temp/logs');

const Logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'storage-error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'storage-combined.log') 
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

module.exports = Logger;
