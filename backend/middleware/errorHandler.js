// Central error handler. Keeps responses consistent and avoids leaking
// stack traces / internal details to clients in production.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  // eslint-disable-next-line no-console
  console.error('[error]', err.message);
  const status = err.status || 500;
  return res.status(status).json({
    error: status === 500 ? 'Something went wrong.' : err.message,
  });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
