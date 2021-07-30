const { number } = require('joi');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const Review = require('./review');

//We create an ImageSchema along with a virtual so we can easily and dynamically apply transformations to our images, specifically we use it to display our images as thumbnails when we want to delete them
const ImageSchema = new Schema({
  url: String,
  filename: String,
});

//Next we setup a virtual on the ImageSchema to replace the url with a modified one that will shrink the image to thumbnail size
ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_100');
});

const opts = { toJSON: { virtuals: true } };

const BookSchema = new Schema(
  {
    title: String,
    description: String,
    author: String,
    ratingInfo: {
      rating: {
        type: Number,
        default: 5,
      },
      numRatings: {
        type: Number,
        default: 1,
      },
      sumRatings: {
        type: Number,
        default: 5,
      },
    },
    language: String,
    genres: [String],
    pages: Number,
    coverImg: String,
    images: [ImageSchema],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    location: String,
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    //We create an entry for reviews - in this case it is an array if 'Review' ObjectIds
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  opts
);

//Below we create a virtual so we can conform to the Mapbox standard and be able to display our book info on the map - it will look for this information under the properties key, and because this isn't in our model we need to make it specially for this case. We already have the info we need in our model, we just need to put it under a properties key, therefore we do it as follows
BookSchema.virtual('properties.mapsPopUp').get(function () {
  let imageSrc;
  if (this.images.length) {
    imageSrc = this.images[0].thumbnail;
  } else {
    imageSrc = this.coverImg ? this.coverImg : '';
  }

  return `
  <div class="d-flex flex-column">
    <img class="img-thumbnail" style="height: 150px; width: auto;" src=${imageSrc}>
    <strong>
      <a class="mx-auto text-decoration-none mt-1" href="/books/${this._id}">${this.title}</a>
    </strong>
    <p class="mb-0 text-muted">${this.location}</p>
  </div>`;
});

//Below we are going to set up middleware to delete all reviews associated with a book when we delete the book - note that we look up 'findByIdAndDelete' in the mongoose docs and it tells us that the middleware 'findOneAndDelete' will be triggered when we call it - since this is a 'post' middleware, we are doing something after the book has been deleted, but we still have access to the deleted book (doc)
BookSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    for (let review of doc.reviews) {
      await Review.findByIdAndDelete(review);
    }

    //OR alternative method that deletes all reviews with an object id inside the reviews array of the deleted book
    // await Review.deleteMany({
    //     _id: {
    //         $in: doc.reviews
    //     }
    // });
  }
});

module.exports = mongoose.model('Book', BookSchema);
