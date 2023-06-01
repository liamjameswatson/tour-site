import mongoose from 'mongoose';
import slugify from 'slugify';
// import validator from 'validator';
import { User } from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'All tours must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less than or equal to 40 characters'],
      minlength: [10, 'A tour must have more than or equal to 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // external libary
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Must be either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be about 1.0'],
      max: [5, 'Rating must be about 5.0'],
      set: (val) => Math.round(val * 10) / 10, // round to one decimal point
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          // this only point to  current document on new Creation,   will not work for updating
          return value < this.price; //if value is less than price return, else false
        },
        enum: {
          message: 'the price discount cannot be more than the price',
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String, //name of img
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //an array of strings
    createdAt: {
      type: Date,
      default: Date.now(), //timestamp (converted automatcally by mongoose)
      select: false, //not sent to client in the res       good for SENSATIVE DATA
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], //Can only be one
      },
      coordinates: [Number], // An array of numbers
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //each time we output JSON object we want vituals to show in data.
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// these virtual properties do not get stored in the database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: .pre() runs just before .save() and .create().      InsertMany will not execute this function
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// // DOCUMENT MIDDLEWARE: .post() runs just after .save() and .create().      InsertMany / find and update functions  will not execute this function
// tourSchema.post('save', function (document, next) {
//   //no longer have this keyword, as document is finished.
//   console.log(document);
//   console.log('document saved...')
//   next();
// });

//QUERY MIDDLEWARE
// all strings that start with find. including find and findone (regular expression)
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now(); // take a timestamp
  next();
});

// populates guides field with the guide's info, from guide's model
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangesAt',
  });
  next();
});

tourSchema.post(/^find/, function (documents, next) {
  //post so query already finished so func has access to all documents produced by the query
  // console.log(documents);
  console.log(`Query took  ${Date.now() - this.start} milliseconds to run`);

  next();
});

// //AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

export const Tour = mongoose.model('Tour', tourSchema);
