const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// Jobs
router.post('/', auth.verify, jobController.postJob);
router.get('/', jobController.getAll);
router.get('/my-matches', auth.verify, jobController.getMyMatches);
router.post('/:id/apply', auth.verify, jobController.applyJob);
router.post('/:id/assign', auth.verify, jobController.assignWorker);
router.get('/search', jobController.search);
router.get('/popular', jobController.getPopularJobs);
router.get('/my-applications', auth.verify, jobController.getMyApplications);

module.exports = router;