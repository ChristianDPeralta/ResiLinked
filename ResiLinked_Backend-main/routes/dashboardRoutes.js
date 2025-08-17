const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Stats
router.get('/barangay', auth.verify, dashboardController.barangayStats);

module.exports = router;