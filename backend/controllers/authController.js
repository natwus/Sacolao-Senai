const bcrypt = require('bcrypt');
const { connectToDatabase } = require('../config/db');

async function register(req, res) {
    const { nome, email, senha } = req.body;
    const connection = await connectToDatabase();

    try {
        const [rows] = await connection.execute('SELECT usuarioUsuario FROM usuario WHERE usuarioUsuario = ?', [email]);

        if (rows.length > 0) {
            return res.status(400).json({ message: 'Erro: Usuario já cadastrado!' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        await connection.execute('INSERT INTO usuario (usuarioNome, usuarioUsuario, usuarioSenha) VALUES (?, ?, ?)', [nome, email, hashedPassword]);

        res.status(200).json({ sucess:true, message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar os dados.' });
    }
}

async function registerSupplier(req, res) {
    const { nome, estado, telefone, email, categoriaSelecionada } = req.body;
    const connection = await connectToDatabase();

    try {
        const [rows] = await connection.execute('SELECT fornecedorNome FROM fornecedor WHERE fornecedorNome = ?', [nome]);

        if (rows.length > 0) {
            return res.status(400).json({ message: 'Erro: Fornecedor já cadastrado!' });
        }

        await connection.execute('INSERT INTO fornecedor (fornecedorNome, fornecedorEstado, fornecedorTelefone, fornecedorEmail, idCategoria) VALUES (?, ?, ?, ?, ?)', [nome, estado, telefone, email, categoriaSelecionada]);

        res.status(200).json({ sucess:true, message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar os dados.' });
    }
}

async function login(req, res) {
    const { email, senha } = req.body;
    const connection = await connectToDatabase();

    try {
        const [rows] = await connection.execute('SELECT usuarioNome, usuarioUsuario, usuarioSenha FROM usuario WHERE usuarioUsuario = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas!' });
        }

        const usuario = rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.usuarioSenha);

        if (senhaValida) {
            return res.status(200).json({
                message: 'Login bem-sucedido!',
                usuario: { nome: usuario.usuarioNome, email: usuario.usuarioUsuario }
            });
        } else {
            return res.status(401).json({ message: 'Credenciais inválidas!' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor!' });
    }
}

module.exports = { register, registerSupplier, login };
