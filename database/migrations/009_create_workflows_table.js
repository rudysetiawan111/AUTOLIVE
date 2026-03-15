/**
 * Migration: Create workflows table
 * Version: 009
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS workflows (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type ENUM('download', 'process', 'upload', 'mixed') NOT NULL,
                nodes JSON NOT NULL,
                edges JSON,
                settings JSON,
                is_active BOOLEAN DEFAULT TRUE,
                is_template BOOLEAN DEFAULT FALSE,
                schedule_type ENUM('manual', 'once', 'hourly', 'daily', 'weekly', 'monthly') DEFAULT 'manual',
                schedule_config JSON,
                last_run_at TIMESTAMP NULL,
                next_run_at TIMESTAMP NULL,
                total_runs INT DEFAULT 0,
                successful_runs INT DEFAULT 0,
                failed_runs INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type),
                INDEX idx_is_active (is_active),
                INDEX idx_is_template (is_template),
                INDEX idx_schedule_type (schedule_type),
                INDEX idx_next_run_at (next_run_at),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 009 completed: workflows table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS workflows;`;
        await connection.execute(query);
        console.log('Migration 009 rolled back: workflows table dropped');
    }
};
