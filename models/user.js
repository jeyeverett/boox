const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

//We only add email to our schema because passport will automatically deal with the username and password fields
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

userSchema.plugin(passportLocalMongoose); //we use this along with the passport methods shown in the index.js file e.g:
//e.g: passport.use(new localStrategy(User.authenticate())); 
//e.g: passport.serializeUser(User.serializeUser()); 
//e.g: passport.deserializeUser(User.deserializeUser());

module.exports = mongoose.model('User', userSchema);