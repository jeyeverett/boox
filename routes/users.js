const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../controllers/users');
const catchAsync = require('../utilities/catchAsync');
const { isLoggedIn } = require('../middleware');

//Here we use the router.route method to group our routes
router
  .route('/register')
  .get(users.renderNewForm)
  .post(catchAsync(users.create));

router
  .route('/login')
  .get(users.renderLoginForm)
  .post(
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    users.authenticateUser
  );

router.get('/logout', users.logout);

router.get('/profile/:id', users.getProfile);

router.post('/favorite/:id', isLoggedIn, users.favorite);

module.exports = router;
