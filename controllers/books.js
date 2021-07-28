//Our controller file essentially consists of all the logic that would be within the route, but separated for cleaner code
const Book = require('../models/book');
const { isValidObjectId } = require('mongoose');

//SERVICES
const { cloudinary } = require('../cloudinary');
//Setting up Mapbox (note that we choose what services we want, in this case we want geocoding)
const mbxStyles = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxStyles({ accessToken: mapBoxToken });

const ITEMS_PER_PAGE = 10;

//home
module.exports.home = async (req, res) => {
  const books = await Book.find({});
  res.render('home', { books });
};

//map
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
  res.render('books/new');
};

//EDIT FORM
module.exports.renderEditForm = async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    //If we can't find the book (i.e. it was deleted or the id is wrong then we have to deal with the error)
    req.flash('error', 'Book not found.');
    res.redirect('/books');
  }
  res.render('books/edit', { book });
};

//UPDATE
module.exports.update = async (req, res) => {
  // if (!req.body.book) throw new ExpressError('Invalid book data.', 400);
  const { id } = req.params;
  req.body.book.genres = req.body.book.genres.split(', ');

  const book = await Book.findByIdAndUpdate(req.params.id, req.body.book, {
    runValidators: true,
    new: true,
  });
  //We take any added images and add them to the book's images array
  const images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  book.images.push(...images);
  //If there are any images to be deleted first we delete them from cloudinary and then we query the database and use the $pull operator to remove from the book images array all items with a filename shown $in request.body.deleteImages
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

  //Note that below we use the populate method to add the information for fields where we are referencing other model instances using an objectID
  const book = await Book.findById(req.params.id)
    //Below we are trying to populate the owner info on the review instance, since it is nested we need to use the approach shown:
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('owner');
  if (!book) {
    //If we can't find the book (i.e. it was deleted or the id is wrong then we have to deal with the error)
    req.flash('error', 'Book not found.');
    res.redirect('/books');
  }
  res.render('books/show', { book });
};

//DELETE
module.exports.delete = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  req.flash('success', 'Book successfully deleted.');
  res.redirect('/books');
};
