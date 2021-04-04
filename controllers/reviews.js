const Review = require('../models/review');
const Campground = require('../models/campground');

//CREATE
module.exports.create = async (req, res) => {
    if (!req.user) {
        req.flash('error', 'Please login or register to leave a review.')
        res.redirect(`/campgrounds/${ req.params.id }`);
    }

    if (req.body.review.body.length < 50) {
        req.flash('error', 'Please leave a more detailed review.');
        return res.redirect(`/campgrounds/${ req.params.id }`);
    }

    const campground = await Campground.findById(req.params.id); //find the campground we are leaving a review for
    const review = new Review(req.body.review); //create a new review model with the data from the form
    review.author = req.user._id; //we set the author of the review to the user that created it
    campground.reviews.push(review); //add the review to the campground
    await review.save();
    await campground.save();
    req.flash('success', 'Review successfully created!');
    res.redirect(`/campgrounds/${ campground._id }`);
}

//DELETE
module.exports.delete = async (req, res) => {
    const { id, reviewID } = req.params;
    //We want to delete a review but we also want to remove the review from the reference in the campground array
    await Review.findByIdAndDelete(reviewID);
    //Below is how we use mongoose to find a campground and remove a specific review from its reviews array
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewID}});
    req.flash('success', 'Review successfully deleted.');
    res.redirect(`/campgrounds/${ id }`);
}