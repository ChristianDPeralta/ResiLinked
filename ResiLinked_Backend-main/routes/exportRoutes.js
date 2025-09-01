const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');
const verifyAdmin = require('../middleware/verifyAdmin');

// All routes require authentication and admin privileges
router.use(auth.verify);
router.use(verifyAdmin);

// Export data
router.get('/:type', exportController.exportData);

module.exports = router;