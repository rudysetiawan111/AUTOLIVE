/**
 * Migration: Create password_resets table
 * Version: 003
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 003 completed: password_resets table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS password_resets;`;
        await connection.execute(query);
        console.log('Migration 003 rolled back: password_resets table dropped');
    }
};
