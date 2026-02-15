const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises; 
const path = require('path');      


//modelos
const Product = require('./models/Product');
const User = require('./models/User');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'contrasecreta6666'; // Tu clave fija

app.use(express.json());

// middleware para autentificar roles y permisos
const authMiddleware = (rolesPermitidos) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ mensaje: 'Acceso denegado' });

        try {
            const verificado = jwt.verify(token, SECRET_KEY);
            req.user = verificado;

            // Verifica rol
            if (rolesPermitidos && !rolesPermitidos.includes(req.user.role)) {
                return res.status(403).json({ mensaje: 'No tienes permisos para esta acción' });
            }
            next();
        } catch (err) {
            res.status(403).json({ mensaje: 'Token no válido' });
        }
    };
};

// rtas de usuarios

const USUARIOS_FILE = path.join(__dirname, 'usuarios_backup.json');

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // encriptar
        const hashedPassword = await bcrypt.hash(password, 10);

        // para guardar en mongo
        const nuevoUsuarioMongo = new User({ 
            username, 
            password: hashedPassword, 
            role: role || 'user' 
        });
        await nuevoUsuarioMongo.save();

        // y aqui guardar en el json
        let usuariosJSON = [];
        try {
            const data = await fs.readFile(USUARIOS_FILE, 'utf8');
            usuariosJSON = JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, se inicia con un array vacio
            usuariosJSON = [];
        }

        usuariosJSON.push({
            id_mongo: nuevoUsuarioMongo._id,
            username,
            role: role || 'user',
            fecha_registro: new Date().toISOString()
        });

        await fs.writeFile(USUARIOS_FILE, JSON.stringify(usuariosJSON, null, 2));

        res.status(201).json({ 
            mensaje: 'Usuario guardado en DB y archivo JSON',
            usuario: username 
        });

    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const usuario = await User.findOne({ username });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
        { username: usuario.username, role: usuario.role }, 
        SECRET_KEY, 
        { expiresIn: '2h' }
    );
    res.json({ token, role: usuario.role });
});



// rutas 
// ver todo
app.get('/api/products', authMiddleware(['user', 'admin']), async (req, res) => {
    const productos = await Product.find();
    res.json(productos);
});

// id
app.get('/api/products/:id', authMiddleware(['user', 'admin']), async (req, res) => {
    const producto = await Product.findById(req.params.id);
    res.json(producto);
});

// stock
app.patch('/api/products/:id/stock', authMiddleware(['user', 'admin']), async (req, res) => {
    const { stock } = req.body; // Solo extraemos stock
    const actualizado = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    res.json(actualizado);
});

// modifcar todo
const PRODUCTOS_FILE = './productos_backup.json';
const actualizarArchivoJSON = async (productos) => {
    await fs.writeFile(PRODUCTOS_FILE, JSON.stringify(productos, null, 2));
};

// solo admins:

// crear
app.post('/api/products', authMiddleware(['admin']), async (req, res) => {
    try {
        // Guardar en MongoDB
        const nuevoProducto = new Product(req.body);
        await nuevoProducto.save();

        // Actualizar JSON
        let productos = [];
        try {
            const data = await fs.readFile(PRODUCTOS_FILE, 'utf8');
            productos = JSON.parse(data);
        } catch (e) { productos = []; }
        
        productos.push(nuevoProducto);
        await actualizarArchivoJSON(productos);

        res.status(201).json({ mensaje: "Creado en DB y JSON", producto: nuevoProducto });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// MODIFICAR TODO EL PRODUCTO (Precio, Nombre, etc.)
app.put('/api/products/:id', authMiddleware(['admin']), async (req, res) => {
    try {
        // Actualizar en MongoDB
        const actualizado = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // Actualizar en JSON
        let productos = JSON.parse(await fs.readFile(PRODUCTOS_FILE, 'utf8'));
        const index = productos.findIndex(p => p._id == req.params.id || p.id_mongo == req.params.id);
        
        if (index !== -1) {
            productos[index] = { ...productos[index], ...req.body };
            await actualizarArchivoJSON(productos);
        }

        res.json({ mensaje: "Producto actualizado totalmente", actualizado });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// eliminar
app.delete('/api/products/:id', authMiddleware(['admin']), async (req, res) => {
    try {
        // Eliminar de MongoDB
        await Product.findByIdAndDelete(req.params.id);

        // Eliminar de JSON
        let productos = JSON.parse(await fs.readFile(PRODUCTOS_FILE, 'utf8'));
        const nuevosProductos = productos.filter(p => p._id != req.params.id && p.id_mongo != req.params.id);
        
        await actualizarArchivoJSON(nuevosProductos);

        res.json({ mensaje: "Producto eliminado de DB y JSON" });
    } catch (e) { res.status(400).json({ error: e.message }); }
});




mongoose.connect('mongodb://localhost:27017/inventario')
    .then(() => {
        app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
    })
    .catch(err => console.error(err));