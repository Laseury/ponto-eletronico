const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    const [, token] = authHeader.split(" ");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredojwt123");
        req.user = decoded; // { id, login, perfil }
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
};

const Role = {
    ADMIN: "Admin",
    GESTOR: "Gestor",
    CONTADOR: "Contador",
    FUNCIONARIO: "Funcionario"
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.perfil)) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        next();
    };
};

module.exports = { authMiddleware, authorizeRoles, Role };
