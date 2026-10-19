const validateIdParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID parameter. ID must be a positive integer.'
    });
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide name, email, and password.'
    });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      status: 'error',
      message: 'Password must be at least 6 characters long.'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide both email and password.'
    });
  }

  next();
};

const validateExpenseCreate = (req, res, next) => {
  const { title, amount, categoryIds } = req.body;

  if (!title || String(title).trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Expense title is required.'
    });
  }

  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Expense amount is required and must be a number greater than 0.'
    });
  }

  if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
    return res.status(400).json({
      status: 'error',
      message: 'categoryIds must be an array of category IDs.'
    });
  }

  next();
};

const validateCategoryCreate = (req, res, next) => {
  const { name, monthlyBudget } = req.body;

  if (!name || String(name).trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Category name is required.'
    });
  }

  if (monthlyBudget !== undefined && monthlyBudget !== null) {
    if (isNaN(Number(monthlyBudget)) || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'monthlyBudget must be a non-negative number.'
      });
    }
  }

  next();
};

module.exports = {
  validateIdParam,
  validateRegister,
  validateLogin,
  validateExpenseCreate,
  validateCategoryCreate
};
