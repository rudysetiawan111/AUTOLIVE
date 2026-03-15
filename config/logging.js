module.exports = {
    // Log levels: error, warn, info, http, debug
    level: process.env.LOG_LEVEL || 'info',
    
    // Log format: combined, common, dev, short, tiny
    format: process.env.LOG_FORMAT || 'combined',
    
    // Log to file
    file: {
        enabled: true,
        path: './logs',
        maxSize: '100m',
        maxFiles: '30d',
        compress: true
    },
    
    // Log to console
    console: {
        enabled: process.env.NODE_ENV !== 'production',
        colorize: true
    },
    
    // Log to external service (optional)
    external: {
        enabled: false,
        service: 'logstash',
        host: process.env.LOGSTASH_HOST,
        port: process.env.LOGSTASH_PORT
    },
    
    // Log rotation
    rotation: {
        enabled: true,
        interval: '1d', // daily rotation
        maxSize: '100m',
        maxFiles: 30,
        compress: true
    },
    
    // Log retention
    retention: {
        error: '90d',
        access: '60d',
        combined: '30d',
        stream: '30d',
        metrics: '7d'
    },
    
    // Log filtering
    filter: {
        excludePaths: ['/health', '/metrics', '/favicon.ico'],
        excludeStatusCodes: [304],
        minDuration: 0, // ms, log only requests longer than this
        sampleRate: 1.0 // 1.0 = 100%, 0.1 = 10%
    },
    
    // Sensitive data masking
    mask: {
        enabled: true,
        fields: ['password', 'token', 'credit_card', 'ssn'],
        pattern: /password|token|authorization|credit|ssn/i,
        replacement: '***MASKED***'
    },
    
    // Additional metadata
    metadata: {
        service: 'autolive-api',
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        hostname: require('os').hostname()
    },
    
    // Alerting
    alerts: {
        enabled: true,
        errorThreshold: 10, // alerts after 10 errors in 5 minutes
        slowRequestThreshold: 1000, // ms
        channels: {
            slack: {
                webhook: process.env.SLACK_WEBHOOK_URL,
                minLevel: 'error'
            },
            email: {
                recipients: ['admin@autolive.com'],
                minLevel: 'error'
            }
        }
    },
    
    // Sampling for high-volume logs
    sampling: {
        http: {
            enabled: true,
            rate: 0.1 // log 10% of HTTP requests
        },
        debug: {
            enabled: true,
            rate: 0.01 // log 1% of debug messages
        }
    },
    
    // Structured logging
    structured: {
        enabled: true,
        format: 'json' // or 'logfmt'
    },
    
    // Performance tracking
    performance: {
        enabled: true,
        trackMemory: true,
        trackCPU: true,
        trackEventLoop: true,
        interval: 60000 // 1 minute
    },
    
    // Audit logging
    audit: {
        enabled: true,
        events: ['login', 'logout', 'stream_start', 'stream_end', 'payment'],
        retention: '365d'
    }
};
