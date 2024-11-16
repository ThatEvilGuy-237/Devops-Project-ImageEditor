const express = require('express');
const router = express.Router();

// /api/users
router.get('/users', (req, res) => {
    res.json({ users: ['John', 'Jane', 'Bob'] });
});

// /api/users/profile
router.get('/users/profile', (req, res) => {
    res.json({
        profile: {
            name: 'Test User',
            email: 'test@example.com'
        }
    });
});

module.exports = router;
