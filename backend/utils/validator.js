const validator = require('validator');

class Validator {
  constructor() {
    this.urlPatterns = {
      youtube: [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
        /^https?:\/\/youtu\.be\/[\w-]{11}/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
        /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]{11}/,
        /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/
      ],
      tiktok: [
        /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/,
        /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+/,
        /^https?:\/\/vt\.tiktok\.com\/[\w]+/,
        /^https?:\/\/www\.tiktok\.com\/embed\/\d+/
      ]
    };

    this.fileExtensions = {
      video: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
      document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      subtitle: ['.srt', '.vtt', '.ass', '.ssa']
    };

    this.mimeTypes = {
      video: [
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        'video/x-flv', 'video/x-ms-wmv', 'video/3gpp', 'video/mpeg'
      ],
      image: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'image/svg+xml', 'image/bmp', 'image/x-icon'
      ],
      audio: [
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
        'audio/aac', 'audio/flac', 'audio/x-m4a'
      ]
    };

    this.countryCodes = [
      'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP', 'KR',
      'CN', 'IN', 'BR', 'MX', 'RU', 'ZA', 'NG', 'EG', 'SA', 'AE',
      'ID', 'MY', 'SG', 'PH', 'TH', 'VN', 'TR', 'PL', 'NL', 'BE',
      'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'IE', 'PT', 'GR', 'HU'
    ];

    this.languageCodes = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'bn', 'pa', 'ta', 'te', 'mr', 'ur', 'gu', 'kn',
      'ml', 'or', 'as', 'mai', 'sat', 'ks', 'sd', 'ne', 'si', 'fa'
    ];

    this.currencyCodes = [
      'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'RUB', 'BRL', 'CAD', 'AUD',
      'CHF', 'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY', 'MXN', 'ZAR'
    ];

    this.timezones = [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Tokyo',
      'Asia/Shanghai', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland'
    ];
  }

  // ==================== BASIC VALIDATION ====================

  // Email validation
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email);
  }

  // Password validation
  isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers;
  }

  // URL validation
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    });
  }

  // YouTube URL validation
  isValidYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return this.urlPatterns.youtube.some(pattern => pattern.test(url));
  }

  // TikTok URL validation
  isValidTikTokUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return this.urlPatterns.tiktok.some(pattern => pattern.test(url));
  }

  // Extract YouTube video ID
  extractYouTubeId(url) {
    if (!this.isValidYouTubeUrl(url)) return null;
    
    const patterns = [
      /v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /embed\/([\w-]{11})/,
      /shorts\/([\w-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  // Extract TikTok video ID
  extractTikTokId(url) {
    if (!this.isValidTikTokUrl(url)) return null;
    
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }

  // ==================== USER VALIDATION ====================

  // Username validation
  isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    
    const minLength = 3;
    const maxLength = 30;
    const pattern = /^[a-zA-Z0-9_.-]+$/;
    
    return username.length >= minLength && 
           username.length <= maxLength && 
           pattern.test(username) &&
           !username.startsWith('.') &&
           !username.endsWith('.');
  }

  // Full name validation
  isValidFullName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const minLength = 2;
    const maxLength = 50;
    const pattern = /^[a-zA-Z\s'-]+$/;
    
    return name.length >= minLength && 
           name.length <= maxLength && 
           pattern.test(name);
  }

  // Phone number validation
  isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return false;
    return validator.isMobilePhone(phone, 'any', { strictMode: false });
  }

  // ==================== CONTENT VALIDATION ====================

  // Video title validation
  isValidVideoTitle(title) {
    if (!title || typeof title !== 'string') return false;
    
    const minLength = 3;
    const maxLength = 100;
    
    return title.length >= minLength && 
           title.length <= maxLength &&
           !title.match(/^\s+$/) && // Not just whitespace
           title.trim().length > 0;
  }

  // Video description validation
  isValidVideoDescription(description) {
    if (!description) return true; // Optional
    if (typeof description !== 'string') return false;
    
    const maxLength = 5000;
    
    return description.length <= maxLength;
  }

  // Hashtag validation
  isValidHashtag(hashtag) {
    if (!hashtag || typeof hashtag !== 'string') return false;
    
    const pattern = /^#[a-zA-Z0-9_]+$/;
    const maxLength = 30;
    
    return pattern.test(hashtag) && 
           hashtag.length <= maxLength &&
           !hashtag.match(/#{2,}/); // No multiple #
  }

  // Multiple hashtags validation
  isValidHashtags(hashtags) {
    if (!Array.isArray(hashtags)) return false;
    if (hashtags.length > 30) return false; // Max 30 hashtags
    
    return hashtags.every(tag => this.isValidHashtag(tag));
  }

  // Tags validation
  isValidTags(tags) {
    if (!Array.isArray(tags)) return false;
    if (tags.length > 20) return false; // Max 20 tags
    
    return tags.every(tag => 
      typeof tag === 'string' && 
      tag.length >= 2 && 
      tag.length <= 30 &&
      /^[a-zA-Z0-9\s-]+$/.test(tag)
    );
  }

  // ==================== FILE VALIDATION ====================

  // File extension validation
  isValidFileExtension(filename, type) {
    if (!filename || typeof filename !== 'string') return false;
    
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    const validExtensions = this.fileExtensions[type] || [];
    
    return validExtensions.includes(ext);
  }

  // Video extension validation
  isValidVideoExtension(filename) {
    return this.isValidFileExtension(filename, 'video');
  }

  // Image extension validation
  isValidImageExtension(filename) {
    return this.isValidFileExtension(filename, 'image');
  }

  // Audio extension validation
  isValidAudioExtension(filename) {
    return this.isValidFileExtension(filename, 'audio');
  }

  // Subtitle extension validation
  isValidSubtitleExtension(filename) {
    return this.isValidFileExtension(filename, 'subtitle');
  }

  // MIME type validation
  isValidMimeType(mimeType, type) {
    if (!mimeType || typeof mimeType !== 'string') return false;
    
    const validMimeTypes = this.mimeTypes[type] || [];
    return validMimeTypes.includes(mimeType);
  }

  // Video MIME type validation
  isValidVideoMimeType(mimeType) {
    return this.isValidMimeType(mimeType, 'video');
  }

  // Image MIME type validation
  isValidImageMimeType(mimeType) {
    return this.isValidMimeType(mimeType, 'image');
  }

  // Audio MIME type validation
  isValidAudioMimeType(mimeType) {
    return this.isValidMimeType(mimeType, 'audio');
  }

  // File size validation
  isValidFileSize(size, maxSizeMB = 500) {
    if (typeof size !== 'number' || size < 0) return false;
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  // ==================== ID VALIDATION ====================

  // ObjectId validation
  isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    
    const pattern = /^[0-9a-fA-F]{24}$/;
    return pattern.test(id);
  }

  // UUID validation
  isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(uuid);
  }

  // API key validation
  isValidApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    const patterns = [
      /^ak_[a-zA-Z0-9]{40,}$/, // Custom API key format
      /^AIza[0-9A-Za-z-_]{35}$/, // YouTube API key
      /^[0-9a-f]{32}$/i, // Generic 32-char hex
      /^[A-Za-z0-9-_]{40}$/ // Generic 40-char
    ];
    
    return patterns.some(pattern => pattern.test(apiKey));
  }

  // JWT validation
  isValidJWT(token) {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if each part is base64url encoded
    return parts.every(part => /^[A-Za-z0-9_-]+$/.test(part));
  }

  // ==================== DATE VALIDATION ====================

  // Date validation
  isValidDate(date) {
    if (!date) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  // Future date validation
  isFutureDate(date) {
    if (!this.isValidDate(date)) return false;
    
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate > now;
  }

  // Past date validation
  isPastDate(date) {
    if (!this.isValidDate(date)) return false;
    
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate < now;
  }

  // Date range validation
  isValidDateRange(startDate, endDate) {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) return false;
    
    return new Date(startDate) <= new Date(endDate);
  }

  // Age validation (must be at least 13)
  isValidAge(birthDate, minAge = 13) {
    if (!this.isValidDate(birthDate)) return false;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= minAge;
  }

  // ==================== NUMERIC VALIDATION ====================

  // Port validation
  isValidPort(port) {
    if (typeof port !== 'number' && typeof port !== 'string') return false;
    
    const portNum = parseInt(port);
    return validator.isPort(portNum.toString());
  }

  // Integer validation
  isValidInteger(num, min = null, max = null) {
    if (typeof num !== 'number') return false;
    if (!Number.isInteger(num)) return false;
    
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    
    return true;
  }

  // Float validation
  isValidFloat(num, min = null, max = null) {
    if (typeof num !== 'number') return false;
    if (isNaN(num)) return false;
    
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    
    return true;
  }

  // Percentage validation (0-100)
  isValidPercentage(value) {
    if (typeof value !== 'number') return false;
    return value >= 0 && value <= 100;
  }

  // Currency validation
  isValidCurrency(amount) {
    if (typeof amount !== 'number' && typeof amount !== 'string') return false;
    return validator.isCurrency(amount.toString());
  }

  // ==================== NETWORK VALIDATION ====================

  // IP validation
  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    return validator.isIP(ip);
  }

  // IPv4 validation
  isValidIPv4(ip) {
    if (!ip || typeof ip !== 'string') return false;
    return validator.isIP(ip, 4);
  }

  // IPv6 validation
  isValidIPv6(ip) {
    if (!ip || typeof ip !== 'string') return false;
    return validator.isIP(ip, 6);
  }

  // Domain validation
  isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    return validator.isFQDN(domain);
  }

  // MAC address validation
  isValidMAC(mac) {
    if (!mac || typeof mac !== 'string') return false;
    return validator.isMACAddress(mac);
  }

  // ==================== FORMAT VALIDATION ====================

  // JSON validation
  isValidJSON(json) {
    if (typeof json !== 'string') return false;
    
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  // Base64 validation
  isValidBase64(str) {
    if (!str || typeof str !== 'string') return false;
    return validator.isBase64(str);
  }

  // Hex color validation
  isValidHexColor(color) {
    if (!color || typeof color !== 'string') return false;
    return validator.isHexColor(color);
  }

  // RGB color validation
  isValidRGBColor(r, g, b) {
    return this.isValidInteger(r, 0, 255) &&
           this.isValidInteger(g, 0, 255) &&
           this.isValidInteger(b, 0, 255);
  }

  // Postal code validation
  isValidPostalCode(code, country = 'US') {
    if (!code || typeof code !== 'string') return false;
    return validator.isPostalCode(code, country);
  }

  // Credit card validation
  isValidCreditCard(card) {
    if (!card || typeof card !== 'string') return false;
    return validator.isCreditCard(card);
  }

  // ==================== LANGUAGE/REGION VALIDATION ====================

  // Language code validation
  isValidLanguageCode(code) {
    if (!code || typeof code !== 'string') return false;
    return this.languageCodes.includes(code);
  }

  // Country code validation
  isValidCountryCode(code) {
    if (!code || typeof code !== 'string') return false;
    return this.countryCodes.includes(code.toUpperCase());
  }

  // Currency code validation
  isValidCurrencyCode(code) {
    if (!code || typeof code !== 'string') return false;
    return this.currencyCodes.includes(code.toUpperCase());
  }

  // Timezone validation
  isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') return false;
    
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  // ==================== WORKFLOW VALIDATION ====================

  // Workflow configuration validation
  isValidWorkflowConfig(config) {
    if (!config || typeof config !== 'object') return false;
    
    const required = ['name', 'steps'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) return false;
    
    // Validate steps
    if (!Array.isArray(config.steps) || config.steps.length === 0) return false;
    
    return config.steps.every(step => this.isValidStepConfig(step));
  }

  // Step configuration validation
  isValidStepConfig(step) {
    if (!step || typeof step !== 'object') return false;
    
    const required = ['type', 'config'];
    const missing = required.filter(field => !step[field]);
    
    if (missing.length > 0) return false;
    
    const validTypes = [
      'collect', 'analyze', 'download', 'process', 'upload',
      'ai-title', 'ai-hashtag', 'ai-virality', 'notification',
      'condition', 'loop', 'delay'
    ];
    
    return validTypes.includes(step.type);
  }

  // Channel configuration validation
  isValidChannelConfig(channel) {
    if (!channel || typeof channel !== 'object') return false;
    
    const required = ['platform', 'name'];
    const missing = required.filter(field => !channel[field]);
    
    if (missing.length > 0) return false;
    
    const validPlatforms = ['youtube', 'tiktok'];
    return validPlatforms.includes(channel.platform);
  }

  // Schedule expression validation
  isValidCronExpression(expression) {
    if (!expression || typeof expression !== 'string') return false;
    
    // Basic cron validation (5 or 6 parts)
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) return false;
    
    // Simple pattern check
    const pattern = /^(\*|([0-5]?\d)|\*\/\d+|\d+(?:-\d+)?(?:\/\d+)?)(?:,(\*|([0-5]?\d)|\*\/\d+|\d+(?:-\d+)?(?:\/\d+)?))*$/;
    
    return parts.every(part => pattern.test(part));
  }

  // ==================== WEBHOOK VALIDATION ====================

  // Webhook URL validation
  isValidWebhookUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    });
  }

  // Webhook secret validation
  isValidWebhookSecret(secret) {
    if (!secret || typeof secret !== 'string') return false;
    
    // Webhook secret should be at least 16 chars
    return secret.length >= 16;
  }

  // ==================== SCHEMA VALIDATION ====================

  // Validate object against schema
  validateSchema(obj, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if not required and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type && !(rules.type === 'array' && Array.isArray(value))) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push(`${field} format is invalid`);
        }
        if (rules.email && !this.isValidEmail(value)) {
          errors.push(`${field} must be a valid email`);
        }
        if (rules.url && !this.isValidUrl(value)) {
          errors.push(`${field} must be a valid URL`);
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
        if (rules.integer && !Number.isInteger(value)) {
          errors.push(`${field} must be an integer`);
        }
      }

      // Array validations
      if (Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${field} must have at most ${rules.maxItems} items`);
        }
        if (rules.uniqueItems && new Set(value).size !== value.length) {
          errors.push(`${field} must contain unique items`);
        }
        if (rules.itemType) {
          for (const item of value) {
            if (typeof item !== rules.itemType) {
              errors.push(`${field} items must be of type ${rules.itemType}`);
              break;
            }
          }
        }
      }

      // Object validations
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (rules.requiredFields) {
          for (const requiredField of rules.requiredFields) {
            if (!value[requiredField]) {
              errors.push(`${field}.${requiredField} is required`);
            }
          }
        }
      }

      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate request body
  validateBody(body, rules) {
    return this.validateSchema(body, rules);
  }

  // Validate query parameters
  validateQuery(query, rules) {
    return this.validateSchema(query, rules);
  }

  // Validate params
  validateParams(params, rules) {
    return this.validateSchema(params, rules);
  }

  // ==================== SANITIZATION ====================

  // Sanitize email
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    return validator.normalizeEmail(email) || '';
  }

  // Sanitize string
  sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return validator.escape(str).trim();
  }

  // Sanitize HTML
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    return validator.escape(html);
  }

  // Sanitize URL
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return validator.stripLow(url).trim();
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return '';
    
    // Remove path traversal
    let sanitized = filename.replace(/[/\\]/g, '_');
    
    // Remove special characters
    sanitized = sanitized.replace(/[^\w\s.-]/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.slice(sanitized.lastIndexOf('.'));
      sanitized = sanitized.slice(0, 255 - ext.length) + ext;
    }
    
    return sanitized;
  }

  // Sanitize hashtag
  sanitizeHashtag(hashtag) {
    if (!hashtag || typeof hashtag !== 'string') return '';
    
    let sanitized = hashtag.trim();
    
    // Ensure it starts with #
    if (!sanitized.startsWith('#')) {
      sanitized = '#' + sanitized;
    }
    
    // Remove spaces and special characters
    sanitized = '#' + sanitized.slice(1).replace(/[^\w]/g, '');
    
    // Limit length
    if (sanitized.length > 30) {
      sanitized = sanitized.slice(0, 30);
    }
    
    return sanitized;
  }

  // ==================== COMPLEX VALIDATIONS ====================

  // Validate pagination parameters
  validatePagination(page, limit) {
    const validated = {
      page: 1,
      limit: 20,
      isValid: true,
      errors: []
    };

    // Validate page
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        validated.isValid = false;
        validated.errors.push('Page must be a positive integer');
      } else {
        validated.page = pageNum;
      }
    }

    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        validated.isValid = false;
        validated.errors.push('Limit must be between 1 and 100');
      } else {
        validated.limit = limitNum;
      }
    }

    return validated;
  }

  // Validate date range
  validateDateRange(startDate, endDate, maxRange = null) {
    const result = {
      startDate: null,
      endDate: null,
      isValid: true,
      errors: []
    };

    // Validate start date
    if (startDate) {
      if (!this.isValidDate(startDate)) {
        result.isValid = false;
        result.errors.push('Invalid start date');
      } else {
        result.startDate = new Date(startDate);
      }
    }

    // Validate end date
    if (endDate) {
      if (!this.isValidDate(endDate)) {
        result.isValid = false;
        result.errors.push('Invalid end date');
      } else {
        result.endDate = new Date(endDate);
      }
    }

    // Validate range
    if (result.startDate && result.endDate) {
      if (result.startDate > result.endDate) {
        result.isValid = false;
        result.errors.push('Start date must be before end date');
      }

      if (maxRange) {
        const diff = result.endDate - result.startDate;
        const maxRangeMs = maxRange * 24 * 60 * 60 * 1000;
        
        if (diff > maxRangeMs) {
          result.isValid = false;
          result.errors.push(`Date range cannot exceed ${maxRange} days`);
        }
      }
    }

    return result;
  }

  // Validate file upload
  validateFileUpload(file, options = {}) {
    const {
      maxSizeMB = 500,
      allowedTypes = ['video'],
      required = true
    } = options;

    const result = {
      isValid: true,
      errors: []
    };

    // Check if file exists
    if (!file) {
      if (required) {
        result.isValid = false;
        result.errors.push('No file uploaded');
      }
      return result;
    }

    // Check file size
    if (!this.isValidFileSize(file.size, maxSizeMB)) {
      result.isValid = false;
      result.errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    const extValid = allowedTypes.some(type => 
      this.isValidFileExtension(file.originalname, type)
    );

    if (!extValid) {
      result.isValid = false;
      result.errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Check MIME type
    const mimeValid = allowedTypes.some(type => 
      this.isValidMimeType(file.mimetype, type)
    );

    if (!mimeValid) {
      result.isValid = false;
      result.errors.push(`Invalid MIME type: ${file.mimetype}`);
    }

    return result;
  }

  // Validate API request
  validateApiRequest(req, rules) {
    const errors = [];

    // Validate body
    if (rules.body) {
      const bodyValidation = this.validateBody(req.body, rules.body);
      if (!bodyValidation.isValid) {
        errors.push(...bodyValidation.errors.map(e => `body.${e}`));
      }
    }

    // Validate query
    if (rules.query) {
      const queryValidation = this.validateQuery(req.query, rules.query);
      if (!queryValidation.isValid) {
        errors.push(...queryValidation.errors.map(e => `query.${e}`));
      }
    }

    // Validate params
    if (rules.params) {
      const paramsValidation = this.validateParams(req.params, rules.params);
      if (!paramsValidation.isValid) {
        errors.push(...paramsValidation.errors.map(e => `params.${e}`));
      }
    }

    // Validate headers
    if (rules.headers) {
      const headersValidation = this.validateSchema(req.headers, rules.headers);
      if (!headersValidation.isValid) {
        errors.push(...headersValidation.errors.map(e => `headers.${e}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new Validator();
