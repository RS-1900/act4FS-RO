const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//registro
exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword,
            role: role || 'user' // si no se asigna un rol, x default sera user
        });

        await newUser.save();
        res.status(201).json({ msg: "Usuario creado con éxito" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// genera el token con el rol del usuario
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};