const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const verifyAdmin = require('../middleware/verifyAdmin'); // enforce admin role

// Apply authentication and admin role check globally
router.use(auth.verify);
router.use(verifyAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.searchUsers);
router.get('/users/:id', adminController.getUserById); // fetch single user
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id', adminController.editUser);

// Job management
router.delete('/jobs/:id', adminController.deleteJob);
router.put('/jobs/:id', adminController.editJob);

// Reports
router.get('/users/download/pdf', adminController.downloadUsersPdf);

// Local error handler for this router
router.use((err, req, res, next) => {
  console.error('Admin route error:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Admin operation failed',
    error: err.message || err
  });
});

module.exports = router;
