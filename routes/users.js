const express = require('express');
const router = express.Router();
const passport = require('passport')
//Here we import the campgrounds controller file
const users = require('../controllers/users');
const catchAsync = require('../utilities/catchAsync');

//Here we use the router.route method to group our routes
router.route('/register')
    .get(users.renderNewForm)
    .post(catchAsync(users.create));

router.route('/login')
    .get(users.renderLoginForm)
    .post(passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), users.authenticateUser);

router.get('/logout', users.logout);

module.exports = router;