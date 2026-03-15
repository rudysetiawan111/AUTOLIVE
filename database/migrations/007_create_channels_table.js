/**
 * Migration: Create channels table
 * Version: 007
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS channels (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                platform ENUM('youtube', 'tiktok', 'instagram', 'facebook', 'twitter') NOT NULL,
                channel_name VARCHAR(255) NOT NULL,
                channel_id VARCHAR(255) NOT NULL,
                channel_url VARCHAR(500),
                avatar_url VARCHAR(500),
                banner_url VARCHAR(500),
                description TEXT,
                subscribers INT DEFAULT 0,
                total_views BIGINT DEFAULT 0,
                total_videos INT DEFAULT 0,
                access_token TEXT,
                refresh_token TEXT,
                token_expires_at TIMESTAMP NULL,
                scopes JSON,
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                last_sync_at TIMESTAMP NULL,
                sync_status ENUM('pending', 'syncing', 'completed', 'failed') DEFAULT 'pending',
                sync_error TEXT,
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_platform (user_id, platform),
                INDEX idx_user_id (user_id),
                INDEX idx_platform (platform),
                INDEX idx_channel_id (channel_id),
                INDEX idx_is_active (is_active),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 007 completed: channels table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS channels;`;
        await connection.execute(query);
        console.log('Migration 007 rolled back: channels table dropped');
    }
};
