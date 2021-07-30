const mongoose = require('mongoose');
const { Schema } = mongoose;
const Review = require('./review');
const Book = require('./book');
const passportLocalMongoose = require('passport-local-mongoose');

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_200');
});

//We only add email to our schema because passport will automatically deal with the username and password fields
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profile: {
    name: String,
    bio: String,
    images: [ImageSchema],
    inbox: [
      {
        messages: [
          {
            message: String,
            timestamp: Date,
          },
        ],
      },
    ],
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    borrowed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    location: String,
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
});

UserSchema.plugin(passportLocalMongoose); //we use this along with the passport methods shown in the index.js file e.g:
//e.g: passport.use(new localStrategy(User.authenticate()));
//e.g: passport.serializeUser(User.serializeUser());
//e.g: passport.deserializeUser(User.deserializeUser());

module.exports = mongoose.model('User', UserSchema);

UserSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});
