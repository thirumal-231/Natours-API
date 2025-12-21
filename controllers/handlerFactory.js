const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return new AppError('No document found.', 404);
    }

    // 204 No Content
    res.status(204).json({
      status: 'success',
      requestedAt: req.requestedTime,
      data: {
        doc: null,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return new AppError('No document found.', 404);
    }

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestedTime,
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
      return new AppError('No doc found.', 404);
    }

    res.status(201).json({
      status: 'success',
      requestedAt: req.requestedTime,
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No doc found.', 404));
    }

    // 200 OK
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestedTime,
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestedTime,
      results: docs.length,
      data: {
        docs,
      },
    });
  });
