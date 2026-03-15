const logger = require('../logger');
const onHeaders = require('on-headers');
const uuid = require('uuid');

// Request ID middleware
const requestId = (req, res, next) => {
    req.id = uuid.v4();
    res.setHeader('X-Request-ID', req.id);
    next();
};

// HTTP request logging middleware
const httpLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Generate request ID if not exists
    if (!req.id) {
        req.id = uuid.v4();
    }
    
    // Log request start
    logger.debug(`Request started: ${req.method} ${req.url}`, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Log response on finish
    onHeaders(res, () => {
        const responseTime = Date.now() - startTime;
        
        // Add response time header
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        
        // Log the request
        logger.logAPIRequest(req, res, responseTime);
        
        // Log slow requests
        if (responseTime > 1000) {
            logger.warn(`Slow request detected: ${req.method} ${req.url} - ${responseTime}ms`, {
                requestId: req.id,
                method: req.method,
                url: req.url,
                responseTime
            });
        }
    });

    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    const errorContext = {
        requestId: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?._id,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: {
            'user-agent': req.get('User-Agent'),
            'referer': req.get('Referer'),
            'origin': req.get('Origin')
        }
    };

    logger.logErrorWithContext(err, errorContext);

    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production') {
        delete err.stack;
    }

    next(err);
};

// User action logging middleware
const userActionLogger = (action) => {
    return (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            logger.logUserAction(req.user?._id, action, {
                requestId: req.id,
                params: req.params,
                query: req.query,
                body: req.body,
                response: data,
                statusCode: res.statusCode
            });
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Stream event logging middleware
const streamEventLogger = (req, res, next) => {
    if (req.params.streamId) {
        req.streamContext = {
            streamId: req.params.streamId,
            action: req.method + ' ' + req.route.path
        };
    }
    next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    onHeaders(res, () => {
        const memoryUsed = process.memoryUsage();
        const cpuUsed = process.cpuUsage(startCpu);
        
        const memoryDiff = {
            rss: memoryUsed.rss - startMemory.rss,
            heapTotal: memoryUsed.heapTotal - startMemory.heapTotal,
            heapUsed: memoryUsed.heapUsed - startMemory.heapUsed,
            external: memoryUsed.external - startMemory.external
        };
        
        logger.logSystemMetric('request_memory', JSON.stringify(memoryDiff), {
            path: req.route?.path || req.url,
            method: req.method
        });
        
        logger.logSystemMetric('request_cpu', JSON.stringify(cpuUsed), {
            path: req.route?.path || req.url,
            method: req.method
        });
    });
    
    next();
};

// Security event logger
const securityLogger = (event, severity = 'warn') => {
    return (req, res, next) => {
        const details = {
            requestId: req.id,
            method: req.method,
            url: req.url,
            body: req.body,
            query: req.query
        };

        logger.logSecurityEvent(event, req.user?._id, req.ip, details);
        next();
    };
};

// Audit trail middleware
const auditTrail = (req, res, next) => {
    const auditData = {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        userId: req.user?._id,
        userRole: req.user?.role,
        action: req.method,
        resource: req.baseUrl + req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.session?.id
    };

    // Store audit data in request for later use
    req.audit = auditData;

    // Log to audit file
    logger.info('AUDIT_TRAIL', auditData);

    next();
};

module.exports = {
    requestId,
    httpLogger,
    errorLogger,
    userActionLogger,
    streamEventLogger,
    performanceMonitor,
    securityLogger,
    auditTrail
};
