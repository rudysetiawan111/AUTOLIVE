-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255),
  platform VARCHAR(50),
  api_key TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  platform VARCHAR(50),
  subscriber_count INT,
  user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  platform VARCHAR(50),
  channel_id INT REFERENCES channels(id),
  views INT,
  likes INT,
  upload_date TIMESTAMP,
  url TEXT
);

-- Workflow
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  video_id INT REFERENCES videos(id),
  engagement_rate VARCHAR(20),
  category VARCHAR(50),
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Viral Video
CREATE TABLE viral_videos (
  id SERIAL PRIMARY KEY,
  video_id INT REFERENCES videos(id),
  platform VARCHAR(50),
  rank INT,
  viral_score FLOAT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execution
CREATE TABLE executions (
  id SERIAL PRIMARY KEY,
  workflow_id INT REFERENCES workflows(id),
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);
