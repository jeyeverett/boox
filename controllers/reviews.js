const Review = require('../models/review');
const Book = require('../models/book');

//CREATE
module.exports.create = async (req, res) => {
  if (!req.user) {
    req.flash('error', 'Please login or register to leave a review.');
    res.redirect(`/books/${req.params.id}`);
  }

  if (req.body.review.body.length < 50) {
    req.flash('error', 'Please leave a more detailed review.');
    return res.redirect(`/books/${req.params.id}`);
  }

  const book = await Book.findById(req.params.id);
  const review = new Review(req.body.review);
  review.author = req.user._id;

  book.reviews.push(review);
  book.ratingInfo.numRatings = Number(book.ratingInfo.numRatings) + 1;
  book.ratingInfo.sumRatings =
    Number(book.ratingInfo.sumRatings) + Number(req.body.review.rating);
  book.ratingInfo.rating = (
    Number(book.ratingInfo.sumRatings) / Number(book.ratingInfo.numRatings)
  ).toFixed(2);

  await review.save();
  await book.save();
  req.flash('success', 'Review successfully created!');
  res.redirect(`/books/${book._id}`);
};

//DELETE
module.exports.delete = async (req, res) => {
  const { id, reviewID } = req.params;

  const review = await Review.findById(reviewID);
  const book = await Book.findById(id);

  await book.reviews.pull(reviewID);

  book.ratingInfo.numRatings = Number(book.ratingInfo.numRatings) - 1;
  book.ratingInfo.sumRatings =
    Number(book.ratingInfo.sumRatings) - Number(review.rating);
  book.ratingInfo.rating = (
    Number(book.ratingInfo.sumRatings) / Number(book.ratingInfo.numRatings)
  ).toFixed(2);

  await book.save();
  await Review.findByIdAndDelete(reviewID);

  req.flash('success', 'Review successfully deleted.');
  res.redirect(`/books/${id}`);
};
