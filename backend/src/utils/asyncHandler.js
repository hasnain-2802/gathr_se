// Works on Express 4 and 5: any error in an async handler goes to the error middleware
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
