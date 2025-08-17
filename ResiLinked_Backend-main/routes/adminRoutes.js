const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Verify all admin routes
router.use(auth.verify);
router.use(auth.verifyAdmin);

/**
 * Dashboard Routes
 */
router.route('/dashboard')
  .get(adminController.getDashboard);

/**
 * User Management Routes
 */
router.route('/users')
  .get(adminController.searchUsers);

router.route('/users/:id')
  .delete(adminController.deleteUser)
  .put(adminController.editUser);

/**
 * Job Management Routes
 */ 
router.route('/jobs/:id')
  .delete(adminController.deleteJob)
  .put(adminController.editJob);

/**
 * Report Routes
 */
router.route('/users/download/pdf')
  .get(adminController.downloadUsersPdf);

// Error handling middleware for admin routes
router.use((err, req, res, next) => {
  console.error('Admin route error:', err);
  res.status(500).json({
    success: false,
    message: 'Admin operation failed',
    error: err.message
  });
});

module.exports = router;