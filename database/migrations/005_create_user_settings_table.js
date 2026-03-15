/**
 * Migration: Create user_settings table
 * Version: 005
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS user_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                theme ENUM('light', 'dark', 'system') DEFAULT 'system',
                language VARCHAR(10) DEFAULT 'id',
                timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
                date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
                time_format VARCHAR(10) DEFAULT '24h',
                notifications_email BOOLEAN DEFAULT TRUE,
                notifications_push BOOLEAN DEFAULT TRUE,
                notifications_desktop BOOLEAN DEFAULT TRUE,
                auto_save BOOLEAN DEFAULT TRUE,
                auto_backup BOOLEAN DEFAULT FALSE,
                backup_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 005 completed: user_settings table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS user_settings;`;
        await connection.execute(query);
        console.log('Migration 005 rolled back: user_settings table dropped');
    }
};
