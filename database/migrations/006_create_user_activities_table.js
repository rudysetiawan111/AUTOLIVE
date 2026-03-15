/**
 * Migration: Create user_activities table
 * Version: 006
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS user_activities (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50),
                entity_id INT,
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at),
                INDEX idx_entity (entity_type, entity_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 006 completed: user_activities table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS user_activities;`;
        await connection.execute(query);
        console.log('Migration 006 rolled back: user_activities table dropped');
    }
};
