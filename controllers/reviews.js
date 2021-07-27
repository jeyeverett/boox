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

  const book = await Book.findById(req.params.id); //find the book we are leaving a review for
  const review = new Review(req.body.review); //create a new review model with the data from the form
  review.author = req.user._id; //we set the author of the review to the user that created it
  book.reviews.push(review); //add the review to the book
  await review.save();
  await book.save();
  req.flash('success', 'Review successfully created!');
  res.redirect(`/books/${book._id}`);
};

//DELETE
module.exports.delete = async (req, res) => {
  const { id, reviewID } = req.params;
  //We want to delete a review but we also want to remove the review from the reference in the book array
  await Review.findByIdAndDelete(reviewID);
  //Below is how we use mongoose to find a book and remove a specific review from its reviews array
  await Book.findByIdAndUpdate(id, { $pull: { reviews: reviewID } });
  req.flash('success', 'Review successfully deleted.');
  res.redirect(`/books/${id}`);
};
