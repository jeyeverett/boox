const express = require('express');
const router = express.Router();
const books = require('../controllers/books');
const { isLoggedIn, isAuthor, validateBook } = require('../middleware');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const catchAsync = require('../utilities/catchAsync');

router.route('/').get(catchAsync(books.home));

router
  .route('/books')
  .get(catchAsync(books.index))
  //Below we use the multer middleware method 'upload', next option can be single or array, and the the argument is the field name used in the multipart form - note that if we use 'array' the req.file object will become req.files
  .post(
    isLoggedIn,
    upload.array('image'),
    validateBook,
    catchAsync(books.create)
  );

router.get('/books/new', isLoggedIn, books.renderNewForm);

//Moving map to its own page
router.get('/books/map', catchAsync(books.map));

router.get(
  '/books/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(books.renderEditForm)
);

router
  .route('/books/:id')
  .get(catchAsync(books.show))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array('image'),
    validateBook,
    catchAsync(books.update)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(books.delete));

module.exports = router;
