/**
 * Migration: Create workflow_executions table
 * Version: 010
 * Date: 2026-03-15
 */

module.exports = {
    up: async (connection) => {
        const query = `
            CREATE TABLE IF NOT EXISTS workflow_executions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                workflow_id INT NOT NULL,
                status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                duration INT,
                nodes_executed JSON,
                nodes_failed JSON,
                input_data JSON,
                output_data JSON,
                error_message TEXT,
                error_stack TEXT,
                logs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
                INDEX idx_workflow_id (workflow_id),
                INDEX idx_status (status),
                INDEX idx_started_at (started_at),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(query);
        console.log('Migration 010 completed: workflow_executions table created');
    },

    down: async (connection) => {
        const query = `DROP TABLE IF EXISTS workflow_executions;`;
        await connection.execute(query);
        console.log('Migration 010 rolled back: workflow_executions table dropped');
    }
};
