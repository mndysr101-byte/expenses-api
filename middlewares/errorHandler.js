const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err.name, '-', err.message);

  // Sequelize Validation Errors (e.g. notNull, isEmail, min, isIn)
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors
    });
  }

  // Sequelize Unique Constraint Error (e.g. duplicate email)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      status: 'error',
      message: errors[0]?.message || 'Duplicate field value entered',
      errors
    });
  }

  // Sequelize Foreign Key or Database Error
  if (err.name === 'SequelizeForeignKeyConstraintError' || err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database constraint or query error. Please check your input values.'
    });
  }

  // Malformed JSON in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload in request body.'
    });
  }

  // Default fallback error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} with method ${req.method} not found.`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
