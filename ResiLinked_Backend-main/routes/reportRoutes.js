const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Reports
router.post('/', auth.verify, reportController.reportUser);
router.get('/', auth.verify, reportController.getReports);
router.patch('/:id', auth.verify, reportController.updateReportStatus);

module.exports = router;