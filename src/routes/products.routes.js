const express = require('express');
const router = express.Router();

const productController = require('../controladores/product.controller');

const { authMiddleware } = require('../middleware');

// rutas

// para poder ver todos los productos (todos)
router.get('/', authMiddleware(['user', 'admin']), productController.getAllProducts);

// buscar producto x ID (todos)
router.get('/:id', authMiddleware(['user', 'admin']), productController.getProductById);

// Crear producto (Admin)
router.post('/', authMiddleware(['admin']), productController.createProduct);

// Actualizar stock (todos) patch xq solo se modifica parcialmente
router.patch('/:id/stock', authMiddleware(['user', 'admin']), productController.updateStock);

// Modificar cualquier campo ( Admin)
router.put('/:id', authMiddleware(['admin']), productController.updateFullProduct);

// Eliminar producto (Admin)
router.delete('/:id', authMiddleware(['admin']), productController.deleteProduct);

module.exports = router;