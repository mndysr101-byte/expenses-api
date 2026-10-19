const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notNull: { msg: 'Category name is required' },
        notEmpty: { msg: 'Category name cannot be empty' },
        len: {
          args: [2, 80],
          msg: 'Category name must be between 2 and 80 characters'
        }
      }
    },
    monthlyBudget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        isDecimal: { msg: 'monthlyBudget must be a valid number' },
        min: {
          args: [0],
          msg: 'monthlyBudget cannot be negative'
        }
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'Categories',
    timestamps: true
  }
);

module.exports = Category;
