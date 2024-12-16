CREATE DATABASE IF NOT EXISTS imageeditor;
USE imageeditor;

CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dimensions TEXT,
    overlay_settings TEXT,
    text_settings TEXT
);
