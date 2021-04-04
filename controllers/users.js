const User = require('../models/user');

//NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render('users/register');
}

//CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({email, username}); //note that if the variable shares the same name as the model field then we can do it like this (as opposed to: {email: email, username: username})
        const newUser = await User.register(user, password); //register is a Passport method used to create a new user instance with a given password (checks if user is unique)
        //Passport provides the login() function which allows use to login the user after they are registered
        req.login(newUser, err => { 
            if (err) return next(err);
        });
        // req.flash('success', `Welcome to Yelp Came ${username}!`);
        res.redirect('/campgrounds');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

//LOGIN FORM
module.exports.renderLoginForm = (req, res) => {
    console.log(req.session);

    res.render('users/login');
}

//LOGIN AUTHENTICATE
module.exports.authenticateUser = (req, res) => {
    // req.flash('success', 'Welcome back!');
    const redirectURL = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo; //this is how we delete something from an object - we don't need it after the line above so we delete it
    res.redirect(redirectURL);
}

//LOGOUT
module.exports.logout = (req, res) => {
    req.logout();
    // req.flash('success', 'Logged out.');
    res.redirect('/campgrounds');
}