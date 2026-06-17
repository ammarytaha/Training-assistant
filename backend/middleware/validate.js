const { validationResult } = require('express-validator');

// Runs after an express-validator chain. Collects errors into one response.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg, // first message for simple UIs
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  return next();
}

module.exports = validate;
