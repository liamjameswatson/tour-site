import multer from 'multer';
import sharp from 'sharp';
import { Tour } from './../models/tourModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import * as factory from './handlerFactory.js';
import { AppError } from '../utils/appError.js';

const multerStorage = multer.memoryStorage(); // stores it as a buffer

const multerFilter = (req, file, cb) => {
  // filter for only allowing image files to be uploaded.
  if (file.mimetype.startsWith('image')) {
    cb(null, true, () => {
      console.log('hello from this callback function');
    });
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadTourImages = upload.fields([
  // one image and an array of images use upload.fields([...])
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    console.log('no images found');
    console.log(req.files);
    return next();
  }

  // 1) Cover images

  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //3:2 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);
  req.body.imageCover = imageCoverFilename;

  //2) Multiple Images
  // for each image, process the image, save image(using unique file name and index 1,2,3 and push to array)
  req.body.images = [];
  console.log(req.body.images);
  await Promise.all(
    // awaits for all files before next()
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333) //3:2 ratio
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
      console.log(req.body.images);
    })
  );
  console.log(req.body);
  next();
});


// UPLOAD ONE IMAGE
// upload.single('image')
// UPLOAD MULTIPLE IMAGES (AN ARRAY)
// upload.array('images', 5)

export const aliasTopTours = (req, res, next) => {
  //when someone goes to '.../tours/top-5-cheap',  it will prefill with the queries below
  // console.log(req.query);
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

export const getAllTours = factory.getAll(Tour);

export const getTour = factory.getOne(Tour, { path: 'reviews' });

export const createTour = factory.createOne(Tour);

export const updateTour = factory.updateOne(Tour);

export const deleteTour = factory.deleteOne(Tour);

export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numOfTours: { $sum: 1 }, // each document that goes through the pipeline, add 1 to the sum
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 }, //1 for ascending  -1 for descending
    },
    // {
    //   $match: {_id: { $ne: 'EASY'}}  //not equal   - all ids that are not equal to 'EASY'
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0, // here project is simple.   0 don't show _id or whatever field, 1 to show
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12, //limit the number returned
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// tours-within/:distance/center/:latlng/unit/:unit
//tours-within/233/center/34.111745,-118.113491/unit/mi
export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radiusOfEarthInMiles = 3963.2;
  const radiusOfEarthInKM = 6378.1;
  const radius =
    unit === 'mi'
      ? distance / radiusOfEarthInMiles
      : distance / radiusOfEarthInKM;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

export const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //the distance returned is in meters
  const convertMetersToMiles = 0.000621371;
  const convertMetersToKm = 0.001;

  const convertedDistance =
    unit === 'mi' ? convertMetersToMiles : convertMetersToKm;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: convertedDistance,
        // maxDistance: number,
        // query: {},
        // includeLocs: '',
        // num: number,
        // spherical: boolean
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
