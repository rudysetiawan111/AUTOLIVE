/**
 * Migration: Create users table
 * Version: 001
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                avatar_url VARCHAR(500),
                bio TEXT,
                website VARCHAR(255),
                location VARCHAR(100),
                phone_number VARCHAR(20),
                email_verified BOOLEAN DEFAULT FALSE,
                email_verified_at TIMESTAMP NULL,
                two_factor_enabled BOOLEAN DEFAULT FALSE,
                two_factor_secret VARCHAR(255),
                role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
                status ENUM('active', 'inactive', 'suspended', 'banned') DEFAULT 'active',
                last_login_at TIMESTAMP NULL,
                last_login_ip VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                INDEX idx_email (email),
                INDEX idx_username (username),
                INDEX idx_status (status),
                INDEX idx_role (role),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 001 completed: users table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS users;`;
        await connection.execute(query);
        console.log('Migration 001 rolled back: users table dropped');
    }
};
