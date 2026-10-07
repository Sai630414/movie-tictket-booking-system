export const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Internal Server Error', errorCode = 'SERVER_ERROR', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    errorCode,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};
