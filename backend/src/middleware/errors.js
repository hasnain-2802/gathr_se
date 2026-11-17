const { HttpError } = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, 'Not found'));
}

// Every error leaves in the format { code, message } from API Documentation section 6
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }
  if (status >= 500) {
    console.error(err);
    message = 'Server error';
  }
  res.status(status).json({ code: status, message });
}

module.exports = { notFound, errorHandler };
