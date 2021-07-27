//Below we set up our .env file for use in our application (only if we are not in production). We use .env file to keep secure information (e.g. API keys) separate from our app (in the form of key value pairs) and use the npm package dotenv to access these keys in our app
//Note that NODE_ENV is a node environment variable that can be either development or production
//We access the .env keys in our code by using process.env.key (where key is whatever key we want)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

//EXPRESS AND PACKAGE SETUP
const express = require('express');
const app = express();
//allows us to set the path to the views folder
const path = require('path');
//morgan is a developer tool that logs to the console information about incoming requests/responses
const morgan = require('morgan');
//we use ejs-mate to create the boilerplate
const ejsMate = require('ejs-mate');
//method-override allows us to send requests other than post forms (?_method=PUT)
const methodOverride = require('method-override');
//express-session allows us to set up sessions with our app - this provides statefulness between http requests
const session = require('express-session');
//connect-flash lets us setup flash messages - note that it depends on session middleware and will create a field in the session as required
const MongoDBStore = require('connect-mongo');
const flash = require('connect-flash');
//Passport provides all the user login support we need - note that Passport doesn't use bcrypt, instead it uses Pbkdf2 which is platform independent
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet'); //Helps to secure express apps

//UTILITIES
const ExpressError = require('./utilities/ExpressError');

//EJS SETUP
app.engine('ejs', ejsMate); //ejs-mate lets use use a boilerplate.ejs for all our templates
app.set('view engine', 'ejs'); //
app.set('views', path.join(__dirname, 'views')); //sets the path to the views folder

//DEPENDENCIES SETUP
//Note that app.use(function) tells express to use function on every request that comes in - this is middleware - we are doing something after we get a request, but before a response is sent
app.use(express.urlencoded({ extended: true })); //This tells express to parse POST requests into JSON
app.use(methodOverride('_method')); //Recall this is how we can call methods other than POST from a form
app.use(morgan('dev')); //morgan is a development tool that logs to the console information about incoming requests/responses
//setting up the default directory for static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

//Helmet config
const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net',
];
const styleSrcUrls = [
  'https://kit-free.fontawesome.com/',
  'https://stackpath.bootstrapcdn.com/',
  'https://cdn.jsdelivr.net',
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://*.tiles.mapbox.com/',
  'https://events.mapbox.com/',
];
const fontSrcUrls = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ['blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/dnpfrwpiq/',
        'https://images.unsplash.com/',
        'https://github.com/mdo.png',
        'https://avatars.githubusercontent.com/u/98681',
        'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

//MONGOOSE SETUP
const mongoose = require('mongoose');
//  process.env.MONGO_URL ||
const dbURL = 'mongodb://localhost:27017/boox';

mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Mongo connection established.');
  })
  .catch((err) => {
    console.log('Mongo connection failed.');
    console.log(err);
  });

//SESSION SETUP
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

//If we are using Mongo for our session store we do the following:
const store = MongoDBStore.create({
  mongoUrl: dbURL,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on('error', (e) => {
  console.log('Session store error!', e);
});

//Below we define a variable containing all our desired session options - note that some of these are to deal with deprecation warning
const sessionConfig = {
  store: store, //this is the store variable created above for store sessions on Mongo
  name: 'session', //By default, the name of the cookie is 'cookie.sid' which is obvious, so it is recommended we make up a custom name
  secret, //'thisshouldbeabettersecret!',
  saveUninitialized: true,
  resave: false,
  //We can customize the cookie that gets sent with the session id to the client
  cookie: {
    httpOnly: true, //this protects our cookies from being accessed through javascript
    //secure: true, //we need this when we deploy to make sure our cookies can only be configured over https, but right now our dev server local host is not secure so we comment it out
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //we set it to expire 1 week from when it is created
    maxAge: 1000 * 60 * 60 * 24 * 7, //max age is 1 week
  },
};
app.use(session(sessionConfig));

//PASSPORT
app.use(passport.initialize());
app.use(passport.session()); //required for persistent login (needs to be defined after our session setup)
passport.use(new LocalStrategy(User.authenticate())); //Note that authenticate() is a built in Passport method designed to be used in Passport's Local Strategy
passport.serializeUser(User.serializeUser()); //serialize refers to how we store a user in the session
passport.deserializeUser(User.deserializeUser()); //deserialize refers to how we remove a user from the session

//Middleware for dealing with flash messages - this function will automatically associate any 'success' (we can do this for any key we want, i.e. 'error', 'success', etc...) flash message with the response object (res.locals) - note that this needs to be before any of our routes setup
//Note that we automatically have access to the response object in our ejs templates, but not the req object, which is why we do need to do this
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next(); //We always have to call next in middlewarefunctions
});

//ROUTES SETUP
const bookRoutes = require('./routes/books');
app.use('/', bookRoutes);
const reviewRoutes = require('./routes/reviews');
app.use('/books/:id/reviews', reviewRoutes);
const userRoutes = require('./routes/users');
app.use('/', userRoutes);

//ERROR HANDLING
//We add this to the end of our routes to handle unknown routes
app.use('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong.';
  res.status(statusCode).render('error', { err });
});

//We create the port variable because Heroku will use its own determined port, we use 3000 for development
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WWC Server Initiated on Port ${port}`);
});
