require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helloController = require('./controllers/helloController');
const userController = require('./controllers/userController');
const imageController = require('./controllers/imageController');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
    console.log(`Server is running on ${process.env.SERVER_URL}`);
});
