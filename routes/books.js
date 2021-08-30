const express = require('express');
const router = express.Router();
const books = require('../controllers/books');
const { isLoggedIn, isAuthor, validateBook } = require('../middleware');
const catchAsync = require('../utilities/catchAsync');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/').get(catchAsync(books.home));

router
  .route('/books')
  .get(catchAsync(books.index))
  .post(
    isLoggedIn,
    upload.array('image'),
    validateBook,
    catchAsync(books.create)
  );

router.get('/books/new', isLoggedIn, books.renderNewForm);

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
