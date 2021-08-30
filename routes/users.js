const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../controllers/users');
const catchAsync = require('../utilities/catchAsync');
const {
  isLoggedIn,
  isProfileOwner,
  validateProfile,
  validateMessage,
} = require('../middleware');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

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

router
  .route('/profile/:id/edit')
  .get(isLoggedIn, isProfileOwner, users.getEditProfile)
  .put(
    isLoggedIn,
    isProfileOwner,
    upload.array('image'),
    validateProfile,
    catchAsync(users.editProfile)
  );

router.route('/profile/:id').get(users.getProfile);

router.post('/favorite/:id', isLoggedIn, catchAsync(users.favorite));

router
  .get('/message/:id', isLoggedIn, catchAsync(users.getMessage))
  .post(
    '/message/:id',
    isLoggedIn,
    validateMessage,
    catchAsync(users.sendMessage)
  );

module.exports = router;
