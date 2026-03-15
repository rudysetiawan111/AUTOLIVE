/**
 * Migration: Create user_sessions table
 * Version: 002
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                refresh_token VARCHAR(255) UNIQUE,
                ip_address VARCHAR(45),
                user_agent TEXT,
                device_type ENUM('desktop', 'mobile', 'tablet', 'other') DEFAULT 'other',
                browser VARCHAR(50),
                os VARCHAR(50),
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_session_token (session_token),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 002 completed: user_sessions table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS user_sessions;`;
        await connection.execute(query);
        console.log('Migration 002 rolled back: user_sessions table dropped');
    }
};
