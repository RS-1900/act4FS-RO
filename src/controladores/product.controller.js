const Product = require('../models/Product');

// Ver todos
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ver por ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "No encontrado" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear (Admin)
exports.createProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar Stock
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id, 
            { stock }, 
            { new: true }
        );
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar stock" });
    }
};

// Modificar todo (Admin)
exports.updateFullProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};