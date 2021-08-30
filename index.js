if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet'); //Helps to secure express apps

const ExpressError = require('./utilities/ExpressError');

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`);
    else next();
  });
}

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net',
  'https://code.jquery.com/jquery-3.4.1.slim.min.js',
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
  'https://booxapp.herokuapp.com/',
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

const mongoose = require('mongoose');
const dbURL = process.env.MONGO_URL || 'mongodb://localhost:27017/boox';

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

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoDBStore.create({
  mongoUrl: dbURL,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on('error', (e) => {
  console.log('Session store error!', e);
});

const sessionConfig = {
  store: store,
  name: 'session',
  secret,
  saveUninitialized: true,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const bookRoutes = require('./routes/books');
app.use('/', bookRoutes);
const reviewRoutes = require('./routes/reviews');
app.use('/books/:id/reviews', reviewRoutes);
const userRoutes = require('./routes/users');
app.use('/', userRoutes);

app.use('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong.';
  res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`WWC Server Initiated on Port ${port}`);
});

const io = require('./socket').init(server);

io.use((socket, next) => {
  socket.userId = socket.handshake.auth.userId;

  if (!socket.userId) {
    return next(new ExpressError('User must be logged in.', 400));
  }

  socket.on('private message', ({ to, content }) => {
    socket.to(to).emit('private message', {
      content,
      from: socket.id,
    });
  });
  next();
});

io.on('connection', (socket) => {
  const users = {};
  for (let [id, socket] of io.of('/').sockets) {
    users[socket.userId] = id;
  }
  io.emit('users', users);
});

io.on('error', (err) => {
  console.log(err);
});
