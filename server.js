require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync();
    console.log('Database models synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`ExpenseFlow REST API server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server or connect to database:', error.message);
    process.exit(1);
  }
};

startServer();
