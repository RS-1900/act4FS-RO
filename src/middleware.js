const jwt = require('jsonwebtoken');

const authMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: "No hay token, permiso denegado" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Contiene id y role

      if (rolesPermitidos && !rolesPermitidos.includes(req.user.role)) {
        return res.status(403).json({ msg: "No tienes permisos para esta acción" });
      }
      next();
    } catch (error) {
      res.status(401).json({ msg: "Token no válido" });
    }
  };
};

module.exports = { authMiddleware };