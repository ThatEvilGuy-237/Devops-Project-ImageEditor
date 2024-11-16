const express = require('express');
const router = express.Router();

// /api/hello
router.get('/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

// /api/hello/:name
router.get('/hello/:name', (req, res) => {
    const name = req.params.name;
    res.json({ message: `Hello, ${name}!` });
});

// /api/greet
router.get('/greet', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
});

module.exports = router;
