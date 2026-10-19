const sequelize = require('../config/database');
const User = require('./User');
const Expense = require('./Expense');
const Category = require('./Category');

// 1. User <-> Expense (One-to-Many)
User.hasMany(Expense, {
  foreignKey: 'userId',
  as: 'expenses',
  onDelete: 'CASCADE'
});
Expense.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 2. User <-> Category (One-to-Many)
User.hasMany(Category, {
  foreignKey: 'userId',
  as: 'categories',
  onDelete: 'CASCADE'
});
Category.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 3. Expense <-> Category (Many-to-Many via ExpenseCategories)
Expense.belongsToMany(Category, {
  through: 'ExpenseCategories',
  as: 'categories',
  foreignKey: 'expenseId',
  otherKey: 'categoryId'
});
Category.belongsToMany(Expense, {
  through: 'ExpenseCategories',
  as: 'expenses',
  foreignKey: 'categoryId',
  otherKey: 'expenseId'
});

module.exports = {
  sequelize,
  User,
  Expense,
  Category
};
