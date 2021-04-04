const mongoose = require('mongoose');
const cities = require('./cities');
const images = require('./images');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

const dbURL = process.env.MONGO_URL || 'mongodb://localhost:27017/westcoastcamping';

mongoose.connect('mongodb+srv://administrator:rq3SbLmHDXmnVLAH@coast2coastcamping.unfy8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => {
        console.log('Mongo connection established.');
    })
    .catch((err) => {
        console.log('Mongo connection failed.');
        console.log(err);
    });

    //the sample function takes an array and returns a random item from it
const sample = (array) => array[Math.floor(Math.random() * array.length)];

//This async functions deletes the collections and then
const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20 + 10);
        const campground = new Campground({
            author: "60691c552bda620015920b38",
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Necessitatibus dicta a aliquid nam aliquam consectetur ducimus quisquam, fuga reiciendis tenetur iure assumenda numquam placeat rerum. Voluptatum enim ab doloribus voluptas?',
            price,
            images: [
                {
                    url: `${sample(images)}`,
                    filename: 'westcoastcamping/sample1'
                  },
                  {
                    url: `${sample(images)}`,
                    filename: 'westcoastcamping/sample2'
                  }
              ],
            geometry: 
                {   //Note that geoJSON expects longitude first
                    coordinates: [cities[random1000].longitude, cities[random1000].latitude], 
                    type: "Point" 
                }
        })
        await campground.save();
    }
}

//Call the seedDB async function and when it completes close the connection to Mongo
seedDB().then( () => {
    mongoose.connection.close();
});