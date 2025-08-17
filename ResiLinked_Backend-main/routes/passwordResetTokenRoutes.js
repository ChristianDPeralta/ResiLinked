const express = require('express');
const router = express.Router();
const passwordResetTokenController = require('../controllers/passwordResetTokenController');
const auth = require('../middleware/auth');

// Token Management (Admin)
router.get('/', auth.verify, auth.verifyAdmin, passwordResetTokenController.getAllTokens);
router.delete('/:id', auth.verify, auth.verifyAdmin, passwordResetTokenController.deleteToken);
router.patch('/:id/used', auth.verify, auth.verifyAdmin, passwordResetTokenController.markAsUsed);

module.exports = router;