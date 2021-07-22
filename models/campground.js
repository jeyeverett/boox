const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

//We create an ImageSchema along with a virtual so we can easily and dynamically apply transformations to our images, specifically we use it to display our images as thumbnails when we want to delete them
const ImageSchema = new Schema({
    url: String,
    filename: String
});

//Next we setup a virtual on the ImageSchema to replace the url with a modified one that will shrink the image to thumbnail size
ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true }};

const CampgroundSchema = new Schema({
    title: String,
    //We redefine our image requirements here to reflect Cloudinary integration
    images: [ImageSchema],
    //Below we add a model entry for our geoData (this data follows a standard format called GeoJSON), note that we are following the mongoose/mongo convention for setting up geo/location data because MongoDB has excellent support for geospatial queries on GeoJSON objects.
    geometry: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: { //We add an author field to the campgrounds model so we know who created it
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    //We create an entry for reviews - in this case it is an array if 'Review' ObjectIds
    reviews: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Review'
        }
    ]
}, opts);

//Below we create a virtual so we can conform to the Mapbox standard and be able to display our campground info on the map - it will look for this information under the properties key, and because this isn't in our model we need to make it specially for this case. We already have the info we need in our model, we just need to put it under a properties key, therefore we do it as follows
CampgroundSchema.virtual('properties.mapsPopUp').get(function () {
    let imageSrc;
    if (this.images.length) {
        imageSrc = this.images[0].thumbnail;
    } else {
        imageSrc = "";
    }

    return `<img class="img-thumbnail" src=${imageSrc}>
            <strong><a class="mx-auto" href="/campgrounds/${this._id}">${this.title}</a></strong>
            <br>
            <p class="mb-0 text-muted">${this.location}</p>`
});

//Below we are going to set up middleware to delete all reviews associated with a campground when we delete the campground - note that we look up 'findByIdAndDelete' in the mongoose docs and it tells us that the middleware 'findOneAndDelete' will be triggered when we call it - since this is a 'post' middleware, we are doing something after the campground has been deleted, but we still have access to the deleted campground (doc)
CampgroundSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        for (let review of doc.reviews) {
            await Review.findByIdAndDelete(review);
        }

        //OR alternative method that deletes all reviews with an object id inside the reviews array of the deleted campground
        // await Review.deleteMany({
        //     _id: {
        //         $in: doc.reviews
        //     }
        // });
    }
});

module.exports = mongoose.model('Campground', CampgroundSchema);
