const express = require('express');
//We use the option shown to give access to req.params
const router = express.Router({mergeParams: true});
//Here we import the campgrounds controller file
const reviews = require('../controllers/reviews');
const { isLoggedIn, isReviewAuthor, validateReview } = require('../middleware'); //this is our custom middleware.js file
//catchAsync is a function we've defined in a separate folder and required here that allows us to catch async errors
const catchAsync = require('../utilities/catchAsync');

//CREATE REVIEW ROUTE
router.post('/', validateReview, catchAsync(reviews.create));

//DELETE REVIEW ROUTE
router.delete('/:reviewID', isLoggedIn, isReviewAuthor, catchAsync(reviews.delete));

module.exports = router;