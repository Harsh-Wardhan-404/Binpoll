const config = require('../config/environment');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    const message = 'Duplicate entry found';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') {
    const message = 'Required field is missing';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(config.isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
