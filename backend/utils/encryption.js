const crypto = require('crypto');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.saltLength = 64;
    this.tagLength = 16;
    
    // Get encryption key from environment or generate one
    this.secretKey = process.env.ENCRYPTION_KEY || this.generateRandomString(32);
  }

  // Generate random string
  generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Generate random bytes
  generateRandomBytes(length) {
    return crypto.randomBytes(length);
  }

  // Generate salt
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  // Derive key from password
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      100000, // iterations
      this.keyLength,
      'sha256'
    );
  }

  // Encrypt text
  encrypt(text, key = null) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const salt = this.generateSalt();
      
      // Use provided key or derive from secret key
      const encryptionKey = key || 
        this.deriveKey(this.secretKey, salt);
      
      const cipher = crypto.createCipheriv(
        this.algorithm,
        encryptionKey,
        iv,
        { authTagLength: this.tagLength }
      );
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine salt, iv, authTag, and encrypted data
      const result = {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: authTag.toString('hex'),
        data: encrypted
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt text
  decrypt(encryptedData, key = null) {
    try {
      // Parse the encrypted data
      const data = JSON.parse(
        Buffer.from(encryptedData, 'base64').toString('utf8')
      );
      
      const salt = Buffer.from(data.salt, 'hex');
      const iv = Buffer.from(data.iv, 'hex');
      const authTag = Buffer.from(data.tag, 'hex');
      
      // Use provided key or derive from secret key
      const encryptionKey = key || 
        this.deriveKey(this.secretKey, salt);
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        encryptionKey,
        iv,
        { authTagLength: this.tagLength }
      );
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(data.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash password
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    
    return `${salt}:${hash}`;
  }

  // Verify password
  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    
    return hash === verifyHash;
  }

  // Create HMAC signature
  createHmac(data, key = null) {
    const hmacKey = key || this.secretKey;
    return crypto
      .createHmac('sha256', hmacKey)
      .update(data)
      .digest('hex');
  }

  // Verify HMAC signature
  verifyHmac(data, signature, key = null) {
    const expectedSignature = this.createHmac(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Create JWT-like token
  createToken(payload, expiresIn = '7d') {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    let exp = now + 7 * 24 * 60 * 60; // 7 days default
    
    if (typeof expiresIn === 'string') {
      const match = expiresIn.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case 'd': exp = now + value * 24 * 60 * 60; break;
          case 'h': exp = now + value * 60 * 60; break;
          case 'm': exp = now + value * 60; break;
          case 's': exp = now + value; break;
        }
      }
    }
    
    const tokenPayload = {
      ...payload,
      iat: now,
      exp
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const signature = this.createHmac(
      `${encodedHeader}.${encodedPayload}`
    );
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Verify and decode token
  verifyToken(token) {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = this.createHmac(
        `${encodedHeader}.${encodedPayload}`
      );
      
      if (!crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )) {
        throw new Error('Invalid signature');
      }
      
      // Decode payload
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64').toString('utf8')
      );
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Encrypt file
  async encryptFile(inputPath, outputPath, key = null) {
    const iv = crypto.randomBytes(this.ivLength);
    const salt = this.generateSalt();
    const encryptionKey = key || this.deriveKey(this.secretKey, salt);
    
    const cipher = crypto.createCipheriv(
      this.algorithm,
      encryptionKey,
      iv,
      { authTagLength: this.tagLength }
    );
    
    const input = require('fs').createReadStream(inputPath);
    const output = require('fs').createWriteStream(outputPath);
    
    // Write salt and iv at the beginning
    output.write(salt);
    output.write(iv);
    
    return new Promise((resolve, reject) => {
      input
        .pipe(cipher)
        .pipe(output)
        .on('finish', () => {
          // Write auth tag at the end
          output.write(cipher.getAuthTag());
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  // Decrypt file
  async decryptFile(inputPath, outputPath, key = null) {
    const input = require('fs').createReadStream(inputPath);
    const output = require('fs').createWriteStream(outputPath);
    
    // Read salt and iv
    const salt = await this.readBytes(input, this.saltLength);
    const iv = await this.readBytes(input, this.ivLength);
    
    const encryptionKey = key || this.deriveKey(this.secretKey, salt);
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      encryptionKey,
      iv,
      { authTagLength: this.tagLength }
    );
    
    // Read the rest of the file
    const chunks = [];
    for await (const chunk of input) {
      chunks.push(chunk);
    }
    
    const fileData = Buffer.concat(chunks);
    
    // Last 16 bytes are the auth tag
    const authTag = fileData.slice(-this.tagLength);
    const encryptedData = fileData.slice(0, -this.tagLength);
    
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    output.write(decrypted);
    output.end();
    
    return new Promise((resolve, reject) => {
      output.on('finish', () => resolve(outputPath));
      output.on('error', reject);
    });
  }

  // Helper to read specific number of bytes from stream
  readBytes(stream, length) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let bytesRead = 0;
      
      const onData = (chunk) => {
        chunks.push(chunk);
        bytesRead += chunk.length;
        
        if (bytesRead >= length) {
          stream.removeListener('data', onData);
          stream.pause();
          resolve(Buffer.concat(chunks).slice(0, length));
        }
      };
      
      stream.on('data', onData);
      stream.on('error', reject);
      stream.resume();
    });
  }

  // Generate API key
  generateApiKey() {
    const prefix = 'ak_';
    const random = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(36);
    
    return prefix + timestamp + random;
  }

  // Generate webhook secret
  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Mask sensitive data
  maskData(data, visibleChars = 4) {
    if (!data) return '';
    
    const str = String(data);
    if (str.length <= visibleChars) return '*'.repeat(str.length);
    
    const visible = str.slice(-visibleChars);
    const masked = '*'.repeat(str.length - visibleChars);
    
    return masked + visible;
  }

  // Create one-time token
  createOneTimeToken(data, expiresIn = 3600) {
    const token = {
      data,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    return this.encrypt(JSON.stringify(token));
  }

  // Verify one-time token
  verifyOneTimeToken(token) {
    try {
      const decrypted = this.decrypt(token);
      const data = JSON.parse(decrypted);
      
      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      return data.data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new Encryption();
