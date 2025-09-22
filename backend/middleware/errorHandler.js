/**
 * Global error handling middleware
 * This should be the last middleware in the stack
 */
function errorHandler(error, req, res, next) {
  // Log the error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File size too large';
    code = 'FILE_TOO_LARGE';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request entity too large';
    code = 'REQUEST_TOO_LARGE';
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  }

  // Database-specific errors
  if (error.number) { // SQL Server error
    if (error.number === 2) {
      statusCode = 503;
      message = 'Database connection failed';
      code = 'DB_CONNECTION_ERROR';
    } else if (error.number === 515) {
      statusCode = 400;
      message = 'Missing required database field';
      code = 'DB_VALIDATION_ERROR';
    } else if (error.number === 2627) {
      statusCode = 409;
      message = 'Duplicate entry found';
      code = 'DUPLICATE_ENTRY';
    }
  }

  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development mode
  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.details = error.message;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;