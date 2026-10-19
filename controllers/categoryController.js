const { Category, Expense } = require('../models');

// GET /api/v1/categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Expense,
          as: 'expenses',
          attributes: ['id', 'title', 'amount', 'status', 'date'],
          through: { attributes: [] }
        }
      ],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Expense,
          as: 'expenses',
          attributes: ['id', 'title', 'amount', 'paymentMethod', 'status', 'date'],
          through: { attributes: [] }
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      category
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, monthlyBudget } = req.body;
    const trimmedName = String(name).trim();

    const existingCategory = await Category.findOne({
      where: {
        name: trimmedName,
        userId: req.user.id
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a category with this name.'
      });
    }

    const category = await Category.create({
      name: trimmedName,
      monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : null,
      userId: req.user.id
    });

    return res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found.'
      });
    }

    const { name, monthlyBudget } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName !== category.name) {
        const duplicate = await Category.findOne({
          where: { name: trimmedName, userId: req.user.id }
        });
        if (duplicate) {
          return res.status(400).json({
            status: 'error',
            message: 'You already have a category with this name.'
          });
        }
      }
    }

    await category.update({
      name: name !== undefined ? String(name).trim() : category.name,
      monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : category.monthlyBudget
    });

    return res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found.'
      });
    }

    await category.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Category deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
