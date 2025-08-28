const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

// Ratings
router.post('/', ratingController.rateUser);
router.get('/top-rated', ratingController.getTopRated);
router.get('/:userId', ratingController.getRatings);
router.post('/:ratingId/report', ratingController.reportRating);

module.exports = router;

module.exports = router;