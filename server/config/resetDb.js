const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
    try {
        // Create connection without database selection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root'
        });

        // Drop database if exists
        await connection.query('DROP DATABASE IF EXISTS image_editor');
        console.log('Dropped existing database');

        // Read and execute SQL file
        const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        const statements = sqlScript.split(';').filter(stmt => stmt.trim());

        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed:', statement.trim().slice(0, 50) + '...');
            }
        }

        console.log('Database reset completed successfully');
        await connection.end();
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    resetDatabase();
}

module.exports = resetDatabase;
