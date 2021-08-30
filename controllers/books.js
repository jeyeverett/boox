const Book = require('../models/book');
const { isValidObjectId } = require('mongoose');

//SERVICES
const { cloudinary } = require('../cloudinary');
const mbxStyles = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxStyles({ accessToken: mapBoxToken });

const ITEMS_PER_PAGE = 10;

// HOME
module.exports.home = async (req, res) => {
  const books = await Book.find({});
  res.render('home', { books });
};

// MAP
module.exports.map = async (req, res) => {
  const books = await Book.find({});
  res.render('books/map', { books });
};

//INDEX
module.exports.index = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;

  const totalItems = await Book.find().countDocuments();
  const books = await Book.find({})
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  res.render('books/index', {
    books,
    pageInfo: {
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    },
  });
};

//CREATE
module.exports.create = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.book.location,
      limit: 1,
    })
    .send();

  if (!geoData.body.features.length) {
    res.locals.error = 'Please enter a valid location, e.g. Vancouver, BC';
    const { book } = req.body;
    return res.status(400).render(`books/new`, { book });
  }

  req.body.book.geometry = geoData.body.features[0].geometry;
  req.body.book.genres = req.body.book.genres.toLowerCase().split(', ');

  const newBook = new Book(req.body.book);

  newBook.images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));

  newBook.owner = req.user._id;
  await newBook.save();
  req.flash('success', 'Successfully created a new book!');
  res.redirect(`/books/${newBook._id}`);
};

//NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render('books/new', { book: null });
};

//EDIT FORM
module.exports.renderEditForm = async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    req.flash('error', 'Book not found.');
    res.redirect('/books');
  }
  res.render('books/edit', { book });
};

//UPDATE
module.exports.update = async (req, res) => {
  const { id } = req.params;
  req.body.book.genres = req.body.book.genres.split(', ');

  const book = await Book.findByIdAndUpdate(id, req.body.book, {
    runValidators: true,
    new: true,
  });
  const images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  book.images.push(...images);

  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await book.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  await book.save();
  req.flash('success', 'Book updated successfully!');
  res.redirect(`/books/${id}`);
};

//SHOW
module.exports.show = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    req.flash('error', 'Invalid book ID.');
    res.redirect('/books');
  }

  const book = await Book.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('owner');
  if (!book) {
    req.flash('error', 'Book not found.');
    res.redirect('/books');
  }
  res.render('books/show', { book, review: null });
};

//DELETE
module.exports.delete = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  req.flash('success', 'Book successfully deleted.');
  res.redirect('/books');
};
