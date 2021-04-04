//CLOUDINARY SETUP
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//Below we configure the cloudinary settings using our keys from the .env file
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET

});

//Here we instantiate an instance of cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'westcoastcamping', //this is the folder in cloudinary we will store our stuff in
        allowedFormat: ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
};