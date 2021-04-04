const express = require('express');
const router = express.Router();
//Here we import the campgrounds controller file
const campgrounds = require('../controllers/campgrounds');
//below we import our joi middleware
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware'); //this is our custom middleware.js file
//Below we require the npm package Multer which helps us deal with multipart/form-data (used for uploading files)
const multer  = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({ storage });

//catchAsync is a function we've defined in a separate folder and required here that allows us to catch async errors
const catchAsync = require('../utilities/catchAsync');

router.route('/').get(catchAsync(campgrounds.home));

router.route('/campgrounds')
    .get(catchAsync(campgrounds.index))
    //Below we use the multer middleware method 'upload', next option can be single or array, and the the argument is the field name used in the multipart form - note that if we use 'array' the req.file object will become req.files
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.create));

router.get('/campgrounds/new', isLoggedIn, campgrounds.renderNewForm);

//Moving map to its own page
router.get('/campgrounds/map', catchAsync(campgrounds.map));

router.get('/campgrounds/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

router.route('/campgrounds/:id')
    .get(catchAsync(campgrounds.show))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.update))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.delete));

module.exports = router;