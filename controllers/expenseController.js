const { Op } = require('sequelize');
const { Expense, Category } = require('../models');

// GET /api/v1/expenses
const getAllExpenses = async (req, res, next) => {
  try {
    const { status, paymentMethod, minAmount, maxAmount, categoryId, search } = req.query;

    const whereClause = { userId: req.user.id };

    if (status) {
      whereClause.status = status;
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {};
      if (minAmount !== undefined) {
        if (isNaN(Number(minAmount))) {
          return res.status(400).json({
            status: 'error',
            message: 'minAmount query parameter must be a valid number.'
          });
        }
        whereClause.amount[Op.gte] = Number(minAmount);
      }
      if (maxAmount !== undefined) {
        if (isNaN(Number(maxAmount))) {
          return res.status(400).json({
            status: 'error',
            message: 'maxAmount query parameter must be a valid number.'
          });
        }
        whereClause.amount[Op.lte] = Number(maxAmount);
      }
    }

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const categoryInclude = {
      model: Category,
      as: 'categories',
      attributes: ['id', 'name', 'monthlyBudget'],
      through: { attributes: [] }
    };

    if (categoryId !== undefined) {
      const parsedCatId = Number(categoryId);
      if (!Number.isInteger(parsedCatId) || parsedCatId <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'categoryId query parameter must be a positive integer.'
        });
      }
      categoryInclude.where = { id: parsedCatId };
      categoryInclude.required = true;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [categoryInclude],
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return res.status(200).json({
      status: 'success',
      count: expenses.length,
      expenses
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/expenses/summary
const getExpensesSummary = async (req, res, next) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id, status: 'completed' }
    });

    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const byPaymentMethod = expenses.reduce((acc, item) => {
      acc[item.paymentMethod] = Number(((acc[item.paymentMethod] || 0) + Number(item.amount)).toFixed(2));
      return acc;
    }, {});

    return res.status(200).json({
      status: 'success',
      summary: {
        completedExpensesCount: expenses.length,
        totalCompletedAmount: Number(totalAmount.toFixed(2)),
        breakdownByPaymentMethod: byPaymentMethod
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/expenses/:id
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'monthlyBudget'],
          through: { attributes: [] }
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      expense
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/expenses
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, paymentMethod, status, date, notes, categoryIds } = req.body;

    // Verify all provided categoryIds belong to the authenticated user
    let categoriesToAttach = [];
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      categoriesToAttach = await Category.findAll({
        where: {
          id: categoryIds,
          userId: req.user.id
        }
      });

      if (categoriesToAttach.length !== categoryIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more categoryIds are invalid or do not belong to the authenticated user.'
        });
      }
    }

    const expense = await Expense.create({
      title: String(title).trim(),
      amount,
      paymentMethod: paymentMethod || 'credit_card',
      status: status || 'completed',
      date: date || undefined,
      notes: notes || null,
      userId: req.user.id
    });

    if (categoriesToAttach.length > 0) {
      await expense.setCategories(categoriesToAttach);
    }

    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'monthlyBudget'],
          through: { attributes: [] }
        }
      ]
    });

    return res.status(201).json({
      status: 'success',
      message: 'Expense created successfully',
      expense: createdExpense
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found.'
      });
    }

    const { title, amount, paymentMethod, status, date, notes, categoryIds } = req.body;

    if (categoryIds !== undefined) {
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'categoryIds must be an array of category IDs.'
        });
      }

      if (categoryIds.length > 0) {
        const validCategories = await Category.findAll({
          where: {
            id: categoryIds,
            userId: req.user.id
          }
        });

        if (validCategories.length !== categoryIds.length) {
          return res.status(400).json({
            status: 'error',
            message: 'One or more categoryIds are invalid or do not belong to the authenticated user.'
          });
        }
        await expense.setCategories(validCategories);
      } else {
        await expense.setCategories([]);
      }
    }

    await expense.update({
      title: title !== undefined ? String(title).trim() : expense.title,
      amount: amount !== undefined ? amount : expense.amount,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : expense.paymentMethod,
      status: status !== undefined ? status : expense.status,
      date: date !== undefined ? date : expense.date,
      notes: notes !== undefined ? notes : expense.notes
    });

    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'monthlyBudget'],
          through: { attributes: [] }
        }
      ]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found.'
      });
    }

    await expense.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Expense deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllExpenses,
  getExpensesSummary,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
