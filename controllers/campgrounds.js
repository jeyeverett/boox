//Our controller file essentially consists of all the logic that would be within the route, but separated for cleaner code
const Campground = require('../models/campground');

//SERVICES
const { cloudinary } = require('../cloudinary');
//Setting up Mapbox (note that we choose what services we want, in this case we want geocoding)
const mbxStyles = require('@mapbox/mapbox-sdk/services/geocoding');
const { isValidObjectId } = require('mongoose');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxStyles({ accessToken: mapBoxToken });

const ITEMS_PER_PAGE = 10;

//home
module.exports.home = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render('home', { campgrounds });
};

//map
module.exports.map = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render('campgrounds/map', { campgrounds });
};

//INDEX
module.exports.index = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;

  const totalItems = await Campground.find().countDocuments();
  const campgrounds = await Campground.find({})
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  res.render('campgrounds/index', {
    campgrounds,
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
  //Below we want to geoData for our campground location, forwardGeocode means we provide a location and receive the long/lat coordinates - note that limit refers to how many matches we want, in general it is a good idea to get several matches and get the user to choose the most correct one
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  //Below we attach the geo info onto our campground.geo field
  req.body.campground.geometry = geoData.body.features[0].geometry;
  // if (!req.body.campground) throw new ExpressError('Invalid campground data.', 400); //this was the first method we used to handle errors, before we created the validateCampground function
  const newCampground = new Campground(req.body.campground);
  //Below we map over the files array using implicit return {} to store objects with key-value pairs (url and filename) in the newCampground images array
  newCampground.images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  newCampground.author = req.user._id; //This is how we associate a campground with a user - note that req.user is automatically added by passport
  await newCampground.save();
  req.flash('success', 'Successfully created a new campground!');
  res.redirect(`/campgrounds/${newCampground._id}`);
};

//NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new');
};

//EDIT FORM
module.exports.renderEditForm = async (req, res, next) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    //If we can't find the campground (i.e. it was deleted or the id is wrong then we have to deal with the error)
    req.flash('error', 'Campground not found.');
    res.redirect('/campgrounds');
  }
  res.render('campgrounds/edit', { campground });
};

//UPDATE
module.exports.update = async (req, res) => {
  // if (!req.body.campground) throw new ExpressError('Invalid campground data.', 400);
  const { id } = req.params;
  console.log(req.body);
  const campground = await Campground.findByIdAndUpdate(
    req.params.id,
    req.body.campground,
    { runValidators: true, new: true }
  );
  //We take any added images and add them to the campground's images array
  const images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  campground.images.push(...images);
  //If there are any images to be deleted first we delete them from cloudinary and then we query the database and use the $pull operator to remove from the campground images array all items with a filename shown $in request.body.deleteImages
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  await campground.save();
  req.flash('success', 'Campground updated successfully!');
  res.redirect(`/campgrounds/${id}`);
};

//SHOW
module.exports.show = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    req.flash('error', 'Invalid campground ID.');
    res.redirect('/campgrounds');
  }

  //Note that below we use the populate method to add the information for fields where we are referencing other model instances using an objectID
  const campground = await Campground.findById(req.params.id)
    //Below we are trying to populate the author info on the review instance, since it is nested we need to use the approach shown:
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('author');
  if (!campground) {
    //If we can't find the campground (i.e. it was deleted or the id is wrong then we have to deal with the error)
    req.flash('error', 'Campground not found.');
    res.redirect('/campgrounds');
  }
  res.render('campgrounds/show', { campground });
};

//DELETE
module.exports.delete = async (req, res) => {
  await Campground.findByIdAndDelete(req.params.id);
  req.flash('success', 'Campground successfully deleted.');
  res.redirect('/campgrounds');
};
