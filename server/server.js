require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const initializeDatabase = require('./config/initDatabase');
const helloController = require('./controllers/helloController');
const userController = require('./controllers/userController');
const imageController = require('./controllers/imageController');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database before starting the server
initializeDatabase().then(() => {
    // Middleware
    app.use(cors());
    app.use(express.json());

    // Serve static files from the FrontendImageUploading directory
    app.use(express.static(path.join(__dirname, '..', 'FrontendImageUploading')));

    // Base path for API
    app.use('/api', helloController);
    app.use('/api', userController);
    app.use('/api', imageController);

    // Serve index.html for the root route
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'FrontendImageUploading', 'index.html'));
    });

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
