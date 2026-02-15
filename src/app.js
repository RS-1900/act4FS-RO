const express = require('express');
const mongoose = require('mongoose');
console.log("VALOR DEL SECRET:", process.env.JWT_SECRET);
const productRoutes = require('./routes/products.routes');
const authRoutes = require('./routes/auth.routes');



const app = express();

// Middleware paraJSON
app.use(express.json());

// rutas

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

//prueba
app.get('/', (req, res) => {
    res.send('API de Inventario Funcionando');
});

module.exports = app;