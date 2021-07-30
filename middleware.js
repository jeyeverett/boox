const User = require('./models/user');
const Book = require('./models/book');
const Review = require('./models/review');
const {
  bookSchema,
  reviewSchema,
  profileSchema,
  messageSchema,
} = require('./joiSchema');

module.exports.isLoggedIn = (req, res, next) => {
  // console.log('req.user is:', req.user); //Passport creates the user field on the req object which allows us to easily check what user is currently logged in
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; //returnTo is a custom field we created to store a url we may need to redirect to (i.e. if a user tries to access a page they need to be logged in for, they will be redirected to that page after logging in)
    req.flash('error', 'You need to be signed in to do this.');
    return res.redirect('/login');
  }
  next();
};

module.exports.validateBook = (req, res, next) => {
  const { error } = bookSchema.validate(req.body);
  if (error) {
    //error.details is formatted as an array so we do the following to make it a string
    let msg = error.details.map((el) => el.message).join('');
    msg = msg.replace(/\./, ' ').replace(/\"/, '');
    req.flash('error', msg);
    return res.render('books/new', { book: req.body.book });
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const book = await Book.findById(id);

  if (!book.owner.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that.');
    return res.redirect(`/books/${book._id}`); //need to return here or the code below may be executed
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewID } = req.params;
  const review = await Review.findById(reviewID);

  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that.');
    return res.redirect(`/books/${id}`); //need to return here or the code below may be executed
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join('');
    msg = msg.replace(/\./g, ' ').replace(/\"/g, '');
    req.flash('error', msg);
    const id = req.originalUrl.slice(7, 31);
    return res.status(400).redirect(`/books/${id}`);
  } else {
    next();
  }
};

module.exports.validateProfile = (req, res, next) => {
  const { error } = profileSchema.validate(req.body);

  if (error) {
    let msg = error.details.map((el) => el.message).join('');
    msg = msg.replace(/\./g, ' ').replace(/\"/g, '');
    res.locals.error = msg;
    return res.status(400).render('users/edit-profile', {
      user: {
        ...req.user,
        profile: { ...req.body.profile, images: req.user.profile.images },
        _id: req.user._id,
      },
    });
  } else {
    next();
  }
};

module.exports.isProfileOwner = async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user._id.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that.');
    return res.redirect(`/profile/${id}`);
  }
  next();
};

module.exports.validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join('');
    msg = msg.replace(/\./g, ' ').replace(/\"/g, '');
    const id = req.originalUrl.slice(9, 33);
    req.flash('error', msg);
    return res.status(400).redirect(`/profile/${id}`);
  } else {
    next();
  }
};
