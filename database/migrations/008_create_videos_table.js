/**
 * Migration: Create videos table
 * Version: 008
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS videos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                channel_id INT NOT NULL,
                platform_video_id VARCHAR(255) NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                thumbnail_url VARCHAR(500),
                video_url VARCHAR(500),
                duration INT,
                views INT DEFAULT 0,
                likes INT DEFAULT 0,
                comments INT DEFAULT 0,
                shares INT DEFAULT 0,
                virality_score DECIMAL(5,2),
                category VARCHAR(100),
                tags JSON,
                metrics JSON,
                published_at TIMESTAMP NULL,
                downloaded_at TIMESTAMP NULL,
                download_status ENUM('pending', 'downloading', 'completed', 'failed') DEFAULT 'pending',
                download_path VARCHAR(500),
                processed_at TIMESTAMP NULL,
                process_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
                process_log TEXT,
                virality_prediction JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
                UNIQUE KEY unique_platform_video (channel_id, platform_video_id),
                INDEX idx_channel_id (channel_id),
                INDEX idx_platform_video_id (platform_video_id),
                INDEX idx_virality_score (virality_score),
                INDEX idx_published_at (published_at),
                INDEX idx_download_status (download_status),
                INDEX idx_process_status (process_status),
                FULLTEXT idx_title_description (title, description)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 008 completed: videos table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS videos;`;
        await connection.execute(query);
        console.log('Migration 008 rolled back: videos table dropped');
    }
};
