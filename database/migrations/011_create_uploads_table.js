/**
 * Migration: Create uploads table
 * Version: 011
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS uploads (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                channel_id INT,
                video_id INT,
                platform ENUM('youtube', 'tiktok', 'instagram', 'facebook', 'twitter') NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                file_type VARCHAR(50),
                title VARCHAR(500) NOT NULL,
                description TEXT,
                tags JSON,
                category VARCHAR(100),
                privacy ENUM('public', 'unlisted', 'private') DEFAULT 'public',
                schedule_time TIMESTAMP NULL,
                status ENUM('queued', 'processing', 'uploading', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
                progress INT DEFAULT 0,
                platform_video_id VARCHAR(255),
                platform_video_url VARCHAR(500),
                response_data JSON,
                error_message TEXT,
                retry_count INT DEFAULT 0,
                max_retries INT DEFAULT 3,
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL,
                FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_channel_id (channel_id),
                INDEX idx_platform (platform),
                INDEX idx_status (status),
                INDEX idx_schedule_time (schedule_time),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 011 completed: uploads table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS uploads;`;
        await connection.execute(query);
        console.log('Migration 011 rolled back: uploads table dropped');
    }
};
