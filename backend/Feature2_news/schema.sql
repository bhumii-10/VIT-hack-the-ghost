CREATE DATABASE IF NOT EXISTS disaster_response_db;
USE disaster_response_db;

CREATE TABLE IF NOT EXISTS disaster_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    source_name VARCHAR(100),
    article_url VARCHAR(500) UNIQUE NOT NULL,
    published_at DATETIME,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_published_at (published_at)
);
