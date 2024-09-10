import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from '../../services/userService';
import { jwtDecode } from "jwt-decode";

function Cadastro() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let emailLogado;
    if (token) {
        const decoded = jwtDecode(token);
        emailLogado = decoded.id
    }

    const handleVoltar = () => {
        navigate(-1); 
    };

    const enviarDados = async (event) => {
        event.preventDefault();

        try {
            const data = await registerUser(nome, email, senha, emailLogado);

            if (data.success) {
                alert('Cadastro realizado!')
                navigate('/')
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error('Erro ao enviar os dados:', error);
        }
    };

    return (
        <div>
            <h1>Cadastro Usuário</h1>
            <form onSubmit={enviarDados}>
                <label>Nome</label>
                <input
                    type="text"
                    name="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label>Senha</label>
                <input
                    type="password"
                    name="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />
                <button type="submit">Cadastrar</button>
            </form>
            <Link to={"/"}>Já tem cadastro? </Link>
            <button onClick={handleVoltar}>Voltar</button>
        </div>
    );
}

export default Cadastro;
