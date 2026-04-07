const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Corrige automaticamente a sequence do PostgreSQL para evitar o erro P2002 (id duplicado).
 * Isso acontece quando registros são inseridos fora do fluxo normal (migrations, seeds, etc.).
 */
async function fixSequence(tableName) {
    try {
        await prisma.$executeRawUnsafe(`
            SELECT setval(
                pg_get_serial_sequence('"${tableName}"', 'id'),
                COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
                false
            )
        `);
    } catch (err) {
        // Não bloqueia o fluxo se falhar, apenas loga
        console.warn(`[fixSequence] Aviso ao corrigir sequence de "${tableName}":`, err.message);
    }
}

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

            await fixSequence('usuarios');
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

            // RH não pode criar Admin
            if (req.user.perfil === 'RH' && perfil === 'Admin') {
                return res.status(403).json({ error: "RH não tem permissão para criar administradores." });
            }

            const existe = await prisma.usuario.findUnique({ where: { login } });
            if (existe) {
                return res.status(400).json({ error: "Login já cadastrado." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            await fixSequence('usuarios');
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

    static async getUsers(req, res) {
        try {
            const users = await prisma.usuario.findMany({
                include: {
                    funcionario: {
                        select: { nome: true }
                    }
                },
                orderBy: { criadoEm: 'desc' }
            });

            const usersFormatted = users.map(u => {
                const userObj = { ...u };
                delete userObj.senha;
                return userObj;
            });

            return res.json(usersFormatted);
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            return res.status(500).json({ error: "Erro ao buscar usuários" });
        }
    }
}

module.exports = AuthController;
