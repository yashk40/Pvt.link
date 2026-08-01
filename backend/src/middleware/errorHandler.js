export function notFound(req, _res, next) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} was not found`);
  error.statusCode = 404; error.code = 'NOT_FOUND'; next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Internal server error' : error.message } });
}
