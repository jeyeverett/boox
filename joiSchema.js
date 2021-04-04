//joi helps us perform data validation
const BaseJoi = require('joi');
const sanitizeHTML = require('sanitize-html');

//Below is a 'Joi Extension' we added near the end of the course to deal with XSS vulnerabilities - note that the format is according to the Joi documentation on how to write an extension (an extension is basically a custom Joi validator and in this case, we are using it to make sure no html is allowed in). We use the 'escapeHTML()' syntax in the same way we use the other Joi validations, and we attach it anywhere we are expecting the user to submit a string (which could contain html tags)
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate (value, helpers) {
                const clean = sanitizeHTML(value, {
                    allowedTags: [],
                    allowedAttributes: {}
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value });
                return clean;
            }
        }
    }
});

//We have to call a function to link our extension with Joi
const Joi = BaseJoi.extend(extension);

//Below we are creating a middleware with Joi to help validate our data - we apply it before mongo receives the data
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().max(230).escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(0).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
});