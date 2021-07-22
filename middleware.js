const Campground = require('./models/campground');
const Review = require('./models/review');
const { campgroundSchema, reviewSchema } = require('./joiSchema');
const ExpressError = require('./utilities/ExpressError');

//This middleware function checks to see if the current user is logged in - if they aren't they are redirect to the /login page before they are redirected back to the page they were trying to access
module.exports.isLoggedIn = (req, res, next) => {
    // console.log('req.user is:', req.user); //Passport creates the user field on the req object which allows us to easily check what user is currently logged in
    if (!req.isAuthenticated()) {
        // console.log(req.path, req.originalUrl); //we use this to check where the user is trying to go
        req.session.returnTo = req.originalUrl; //returnTo is a custom field we created to store a url we may need to redirect to (i.e. if a user tries to access a page they need to be logged in for, they will be redirected to that page after logging in)
        req.flash('error', 'You need to be signed in to do this.');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if (error) {
        //error.details is formatted as an array so we do the following to make it a string
        const msg = error.details.map(el => el.message).join('');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    //Below we protect our route by ensuring the current user is the author of the campground before we allow them to update it - we need to do this even though we've hidden our buttons because people can still access the route through Postman or through the url
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that.');
        return res.redirect(`/campgrounds/${campground._id}`); //need to return here or the code below may be executed
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewID } = req.params;
    const review = await Review.findById(reviewID);
    //Below we protect our route by ensuring the current user is the author of the review before we allow them to update it - we need to do this even though we've hidden our buttons because people can still access the route through Postman or through the url
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that.');
        return res.redirect(`/campgrounds/${id}`); //need to return here or the code below may be executed
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        //error.details is formatted as an array so we do the following to make it a string
        const msg = error.details.map(el => el.message).join('');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}