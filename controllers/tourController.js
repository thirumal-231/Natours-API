/* eslint-disable no-unused-vars */
/* eslint-disable node/no-unsupported-features/es-syntax */
const multer = require('multer');
const Tour = require('../models/tourModel');

const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const cloudinary = require('../utils/cloudinary');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Only image upload possible.'), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1️⃣ Upload imageCover
  const uploadCover = () =>
    new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'tours',
            width: 1600,
            aspect_ratio: '16:9',
            crop: 'fill',
            public_id: `tour-${req.params.id}-cover`,
            overwrite: true,
          },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          },
        )
        .end(req.files.imageCover[0].buffer);
    });

  const coverResult = await uploadCover();
  req.body.imageCover = coverResult.secure_url;

  // 2️⃣ Upload gallery images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(
      (file, index) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'tours',
                width: 1600,
                aspect_ratio: '16:9',
                crop: 'fill',
                public_id: `tour-${req.params.id}-${index + 1}`,
                overwrite: true,
              },
              (err, result) => {
                if (err) reject(err);
                req.body.images.push(result.secure_url);
                resolve();
              },
            )
            .end(file.buffer);
        }),
    ),
  );

  next();
});

exports.aliasTopTours = catchAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,duration,price,summary';
  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: null,
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestedTime,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const monthlyPlan = await Tour.aggregate([
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
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTours: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestedTime,
    results: monthlyPlan.length,
    data: {
      monthlyPlan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng',
        400,
      ),
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

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
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

exports.getTourBySlug = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews',
  );
  if (!tour) return next(new AppError('No tour found with that slug', 404));
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
