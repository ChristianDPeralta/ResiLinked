const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const verifyAdmin = require('../middleware/verifyAdmin'); // admin check

// Apply authentication and admin verification to all routes
router.use(auth.verify);      // checks JWT
router.use(verifyAdmin);      // checks userType === "admin"

// Dashboard
router.get('/dashboard', adminController.getDashboard);


// User management
router.get('/users', adminController.searchUsers);
router.get('/users/:id', adminController.getUserById); // <--- new route
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id', adminController.editUser);

// Job management
router.delete('/jobs/:id', adminController.deleteJob);
router.put('/jobs/:id', adminController.editJob);

// Reports
router.get('/users/download/pdf', adminController.downloadUsersPdf);

// Global error handling for this router
router.use((err, req, res, next) => {
  console.error('Admin route error:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Admin operation failed',
    error: err.message || err
  });
});

module.exports = router;
