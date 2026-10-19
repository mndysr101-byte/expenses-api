const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateIdParam, validateExpenseCreate } = require('../middlewares/validateMiddleware');

// Protect all expense routes with JWT authentication
router.use(authenticate);

// GET /api/v1/expenses/summary
router.get('/summary', expenseController.getExpensesSummary);

// GET /api/v1/expenses
router.get('/', expenseController.getAllExpenses);

// GET /api/v1/expenses/:id
router.get('/:id', validateIdParam, expenseController.getExpenseById);

// POST /api/v1/expenses
router.post('/', validateExpenseCreate, expenseController.createExpense);

// PUT /api/v1/expenses/:id
router.put('/:id', validateIdParam, expenseController.updateExpense);

// DELETE /api/v1/expenses/:id
router.delete('/:id', validateIdParam, expenseController.deleteExpense);

module.exports = router;
