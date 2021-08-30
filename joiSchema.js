const BaseJoi = require('joi');
const sanitizeHTML = require('sanitize-html');

const extension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include HTML!',
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHTML(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value) {
          return helpers.error('string.escapeHTML', { value });
        }
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports.bookSchema = Joi.object({
  book: Joi.object({
    title: Joi.string().required().escapeHTML(),
    author: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML(),
    genres: Joi.string().allow('').escapeHTML(),
    language: Joi.string().allow('').escapeHTML(),
    pages: Joi.number().allow(''),
    description: Joi.string().required().max(1000).escapeHTML(),
  }).required(),
  deleteImages: Joi.array(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(0).max(5),
    body: Joi.string().required().escapeHTML(),
  }).required(),
});

module.exports.profileSchema = Joi.object({
  profile: Joi.object({
    name: Joi.string().required().escapeHTML(),
    bio: Joi.string().required().min(0).max(500).escapeHTML(),
    location: Joi.string().required().escapeHTML(),
  }).required(),
  deleteImages: Joi.array(),
});

module.exports.messageSchema = Joi.object({
  message: Joi.object({
    username: Joi.string().required().escapeHTML(),
    content: Joi.string().required().min(0).max(500).escapeHTML(),
    async: Joi.boolean(),
  }).required(),
});
