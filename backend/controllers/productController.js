const { connectToDatabase } = require("../config/db");
const fs = require("fs");
const path = require("path");

async function registerProduct(req, res) {
    const connection = await connectToDatabase();
    const { nome, quantidade, preco, fornecedorSelecionado, emailLogado } = req.body;
    const imagem = req.file ? req.file.filename : null;

    try {
        const [permissoes] = await connection.execute('SELECT permissaoID FROM usuario WHERE usuarioUsuario = ?', [emailLogado]);
        const permissao = permissoes[0].permissaoID;

        if(permissao === 1){
            return res.status(403).json({ message: 'Usuário sem permissão'});
        }

        const [rows] = await connection.execute(
            "SELECT produtoNome FROM produto WHERE produtoNome = ?",
            [nome]
        );

        if (rows.length > 0) {
            return res.status(400).json({ message: "Erro: Produto já cadastrado!" });
        }

        await connection.execute(
            "INSERT INTO produto (produtoNome, produtoQuantidade, produtoPreco, produtoImagem, fornecedorID) VALUES (?, ?, ?, ?, ?)",
            [nome, quantidade, preco, imagem, fornecedorSelecionado]
        );

        const dataHoraCadastro = new Date().toLocaleString();
        const historico = `Usuário '${emailLogado}' cadastrou um novo produto (${nome}) às ${dataHoraCadastro}`

        await connection.execute('INSERT INTO historico (historicoDescricao) VALUES (?)', [historico]);

        res.status(200).json({ sucess: true, message: "Cadastro realizado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao salvar os dados." });
    } finally {
        if (connection) connection.release();
    }
}

async function updateProduct(req, res) {
    const { id, nome, quantidade, preco, fornecedorSelecionado, emailLogado } = req.body;
    const imagem = req.file ? req.file.filename : null;
    const connection = await connectToDatabase();

    try {
        const [permissoes] = await connection.execute('SELECT permissaoID FROM usuario WHERE usuarioUsuario = ?', [emailLogado]);
        const permissao = permissoes[0].permissaoID;

        if(permissao === 1){
            return res.status(403).json({ message: 'Usuário sem permissão'});
        }

        if(quantidade < 5){
            return res.status(401).json({ message: 'Os produtos não podem conter menos de cinco itens no estoque!' })
        }

        let query, params;

        if (imagem) {
            const [rows] = await connection.execute(
                "SELECT produtoImagem FROM produto WHERE produtoID = ?",
                [id] 
            );
            
            if (rows.length > 0) {
                const imageName = rows[0].produtoImagem;
                const imagePath = path.join(__dirname, "../uploads/", imageName);

                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error("Erro ao excluir a imagem:", err);
                        return res.status(500).json({ sucess: false, message: "Erro ao excluir a imagem!" });
                    }
                });
            }

            query = "UPDATE produto SET produtoNome = ?, produtoQuantidade = ?, produtoPreco = ?, produtoImagem = ?, fornecedorID = ? WHERE produtoID = ?";
            params = [
                nome || null, 
                quantidade || null, 
                preco || null, 
                imagem || null, 
                fornecedorSelecionado || null, 
                id || null
            ];
        } else {
            query = "UPDATE produto SET produtoNome = ?, produtoQuantidade = ?, produtoPreco = ?, fornecedorID = ? WHERE produtoID = ?";
            params = [
                nome || null, 
                quantidade || null, 
                preco || null, 
                fornecedorSelecionado || null, 
                id || null
            ];
        }

        const [result] = await connection.execute(query, params);

        const dataHoraCadastro = new Date().toLocaleString();
        const historico = `Usuário '${emailLogado}' alterou o produto (${nome}) às ${dataHoraCadastro}`

        await connection.execute('INSERT INTO historico (historicoDescricao) VALUES (?)', [historico]);

        if (result.affectedRows > 0) {
            res.status(200).json({ sucess: true, message: 'Produto atualizado com sucesso' });
        } else {
            res.status(404).json({ message: "Produto não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao atualizar o produto:", error);
        res.status(500).json({ message: "Erro no servidor ao atualizar o produto" });
    } finally {
        if (connection) connection.release();
    }
}

async function deleteProduct(req, res) {
    const { id } = req.params;
    const { emailLogado, produtoNome } = req.body;
    const connection = await connectToDatabase();

    try {
        const [permissoes] = await connection.execute('SELECT permissaoID FROM usuario WHERE usuarioUsuario = ?', [emailLogado]);
        const permissao = permissoes[0].permissaoID;

        if(permissao !== 3){
            return res.status(403).json({ message: 'Usuário sem permissão'});
        }

        const [rows] = await connection.execute(
            "SELECT produtoImagem FROM produto WHERE produtoID = ?",[id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ sucess: false, message: "Produto não encontrado!" });
        }

        const imageName = rows[0].produtoImagem;
        const imagePath = path.join(__dirname, "../uploads/", imageName);

        const [result] = await connection.execute(
            "DELETE FROM produto WHERE produtoID = ?", [id]
        );

        const dataHoraCadastro = new Date().toLocaleString();
        const historico = `Usuário '${emailLogado}' excluiu o produto (${produtoNome}) às ${dataHoraCadastro}`

        await connection.execute('INSERT INTO historico (historicoDescricao) VALUES (?)', [historico]);

        if (result.affectedRows > 0) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Erro ao excluir a imagem:", err);
                    return res.status(500).json({ sucess: false, message: "Erro ao excluir a imagem!" });
                }

                res.status(200).json({ sucess: true, message: "Produto e imagem excluídos com sucesso!" });
            });
        } else {
            res.status(404).json({ sucess: false, message: "Produto não encontrado!" });
        }
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.status(500).json({ sucess: false, message: "Erro ao excluir produto!" });
    } finally {
        if (connection) connection.release();
    }
}

async function getProducts(req, res) {
    const connection = await connectToDatabase();

    try {
        const [rows] = await connection.execute(
            `SELECT produto.produtoID, produto.produtoNome, produto.produtoQuantidade, 
                    produto.produtoPreco, produto.produtoImagem, fornecedor.fornecedorNome, fornecedor.fornecedorID
             FROM produto
             JOIN fornecedor ON produto.fornecedorID = fornecedor.fornecedorID`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar produtos." });
    } finally {
        if (connection) connection.release();
    }
};

async function getLogs(req, res) {
    const connection = await connectToDatabase();

    try {
        const [rows] = await connection.execute('SELECT historicoID, historicoDescricao FROM historico');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar produtos." });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { registerProduct, getProducts, updateProduct, getLogs, deleteProduct };
