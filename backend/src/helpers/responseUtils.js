// Standardized API response utilities

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  });
};

const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

const createdResponse = (res, data, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  return errorResponse(res, message, 400, errors);
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409);
};

const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return badRequestResponse(res, message, errors);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  validationErrorResponse
};
