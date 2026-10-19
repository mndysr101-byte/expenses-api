const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define(
  'Expense',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: 'Expense title is required' },
        notEmpty: { msg: 'Expense title cannot be empty' },
        len: {
          args: [2, 150],
          msg: 'Expense title must be between 2 and 150 characters'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Expense amount is required' },
        isDecimal: { msg: 'Expense amount must be a valid number' },
        min: {
          args: [0.01],
          msg: 'Expense amount must be greater than 0'
        }
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'cash', 'bank_transfer', 'digital_wallet'),
      allowNull: false,
      defaultValue: 'credit_card',
      validate: {
        isIn: {
          args: [['credit_card', 'cash', 'bank_transfer', 'digital_wallet']],
          msg: 'paymentMethod must be one of: credit_card, cash, bank_transfer, digital_wallet'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed',
      validate: {
        isIn: {
          args: [['pending', 'completed', 'cancelled']],
          msg: 'status must be one of: pending, completed, cancelled'
        }
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: { msg: 'Please provide a valid date (YYYY-MM-DD)' }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'Expenses',
    timestamps: true
  }
);

module.exports = Expense;
