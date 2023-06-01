import { AppError } from '../utils/appError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFields = (err) => {
  const value = err.errmsg.match(/"(.*?)"/)[0];
  // console.log(err);
  console.log(value);
  const message = `Duplicate field value ${value}: Please use another value`;
  return new AppError(message, 404);
};

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    //
  }
  // B) RENDERED PAGE
  console.error('Error 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired, please log in again', 401);
};

const sendErrorProd = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational message that we trust: send message to client
    if (err.isOperational) {
      // from appError.js
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // B) Programming on unkown error: don't leak error details
    }
    // 1) Log error
    console.error('Error 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // b) RENDERED WEBPAGE
  // A) Operational message that we trust: send message to client
  if (err.isOperational) {
    // from appError.js
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // B) Programming on unkown error: don't leak error details
  // 1) Log error
  console.error('Error 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV.trim() === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 11000) error = handleDuplicateFields(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') {
      return (error = handleJWTError());
    }
    if (error.name === 'TokenExpiredError') {
      return (error = handleJWTExpiredError());
    }
    sendErrorProd(err, req, res, () => console.log('sendError =', err));
  }
};
