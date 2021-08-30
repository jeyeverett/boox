const express = require('express');
const router = express.Router({ mergeParams: true });
const reviews = require('../controllers/reviews');
const { isLoggedIn, isReviewAuthor, validateReview } = require('../middleware');
const catchAsync = require('../utilities/catchAsync');

router.post('/', validateReview, catchAsync(reviews.create));

router.delete(
  '/:reviewID',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.delete)
);

module.exports = router;
