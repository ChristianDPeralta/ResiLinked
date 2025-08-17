const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload'); // multer instance
const { registerValidation } = require('../middleware/validate');

// Registration with ID upload
router.post('/register', 
    upload.fields([
        { name: 'idFrontImage', maxCount: 1 },
        { name: 'idBackImage', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 }
    ]),
    registerValidation,
    authController.register
);

// Login
router.post('/login', authController.login);

// Password reset
router.post('/reset/request', authController.resetRequest);
router.post('/reset', authController.resetPassword);

// Email verification
router.post('/verify/resend', authController.resendVerification);

module.exports = router;
