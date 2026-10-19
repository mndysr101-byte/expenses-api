const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateIdParam, validateCategoryCreate } = require('../middlewares/validateMiddleware');

router.use(authenticate);

router.get('/', categoryController.getAllCategories);

router.get('/:id', validateIdParam, categoryController.getCategoryById);

router.post('/', validateCategoryCreate, categoryController.createCategory);

router.put('/:id', validateIdParam, categoryController.updateCategory);

router.delete('/:id', validateIdParam, categoryController.deleteCategory);

module.exports = router;
