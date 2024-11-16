const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        // Create connection without database selection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root'
        });

        // Read SQL file
        const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

        // Split SQL script into individual statements
        const statements = sqlScript.split(';').filter(stmt => stmt.trim());

        // Execute each statement
        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed SQL:', statement.trim().slice(0, 50) + '...');
            }
        }

        console.log('Database initialization completed successfully');
        await connection.end();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabase;
