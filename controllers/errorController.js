const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyErrorDB = (err) => {
  const duplicateKeyName = err.errmsg.match(/(?<=")[^"]+(?=")/);
  const message = `Duplicate key value: ${duplicateKeyName}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Token expired. Please login again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operational error, trusted send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // non operational(programmin or unknown error) hide
  } else {
    // log error
    console.log('ERROR 🚨', err);

    // send generic error
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong.' || JSON.stringify(err),
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // only care about simplifying errors in production because in dev we just want to see the errors and fix

    let errCopy = { ...err };
    if (errCopy.name === 'CastError') {
      errCopy = handleCastErrorDB(errCopy);
    }
    if (errCopy.code === 11000) {
      errCopy = handleDuplicateKeyErrorDB(errCopy);
    }
    if (errCopy.name === 'ValidationError') {
      errCopy = handleValidationErrorDB(errCopy);
    }
    if (errCopy.name === 'JsonWebTokenError') {
      errCopy = handleJWTError(errCopy);
    }
    if (errCopy.name === 'TokenExpiredError') {
      errCopy = handleTokenExpiredError(errCopy);
    }

    sendErrorProd(errCopy, res);
  }
};
