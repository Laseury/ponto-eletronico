const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    static async initAdmin(req, res) {
        try {
            const adminExists = await prisma.usuario.findFirst({
                where: { perfil: 'Admin' }
            });

            if (adminExists) {
                return res.json({ message: "Admin já inicializado." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await prisma.usuario.create({
                data: {
                    nome: "Administrador Sistema",
                    login: "admin",
                    senha: hashedPassword,
                    perfil: "Admin"
                }
            });

            return res.status(201).json({ message: "Admin padrão criado com sucesso (admin / admin123)" });
        } catch (error) {
            console.error("Erro ao inicializar admin:", error);
            return res.status(500).json({ error: "Erro interno ao inicializar admin" });
        }
    }

    static async login(req, res) {
        try {
            const { login, senha } = req.body;

            if (!login || !senha) {
                return res.status(400).json({ error: "Login e senha são obrigatórios." });
            }

            const usuario = await prisma.usuario.findUnique({
                where: { login }
            });

            if (!usuario) {
                return res.status(401).json({ error: "Usuário ou senha incorretos." });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ error: "Usuário ou senha incorretos." });
            }

            const token = jwt.sign(
                { id: usuario.id, login: usuario.login, perfil: usuario.perfil, nome: usuario.nome },
                process.env.JWT_SECRET || "segredojwt123",
                { expiresIn: '8h' }
            );

            const usuarioRetorno = { ...usuario };
            delete usuarioRetorno.senha;

            return res.json({
                usuario: usuarioRetorno,
                token
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro no login" });
        }
    }

    static async register(req, res) {
        try {
            const { nome, login, senha, perfil, funcionarioId } = req.body;

            const existe = await prisma.usuario.findUnique({ where: { login } });
            if (existe) {
                return res.status(400).json({ error: "Login já cadastrado." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            const usuario = await prisma.usuario.create({
                data: {
                    nome,
                    login,
                    senha: hashedPassword,
                    perfil: perfil || 'Funcionario',
                    funcionarioId: funcionarioId ? parseInt(funcionarioId) : null
                }
            });

            const usuarioRetorno = { ...usuario };
            delete usuarioRetorno.senha;
            return res.status(201).json(usuarioRetorno);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao criar usuário" });
        }
    }
}

module.exports = AuthController;
