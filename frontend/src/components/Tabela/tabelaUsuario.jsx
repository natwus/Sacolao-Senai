import { useState, useEffect } from 'react';
import { getUsers, delUser } from '../../services/userService';
import { Link, useNavigate } from 'react-router-dom';
import useSessionTimeout from '../../hooks/useSessionTimeout';
import { jwtDecode } from 'jwt-decode';

function TabelaUsuario() {
    const [usuarios, setUsuarios] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let emailLogado;
    if (token) {
        const decoded = jwtDecode(token);
        emailLogado = decoded.id
    }

    useSessionTimeout();

    useEffect(() => {
        async function fetchUsuarios() {
            try {
                const data = await getUsers();
                setUsuarios(data);
            } catch (error) {
                console.error('Erro ao buscar os usuários:', error);
            }
        }

        fetchUsuarios();
    }, []);

    const deletarUsuario = async (usuarioID) => {
        try {
            const data = await delUser(usuarioID, emailLogado);

            if (data.success) {
                alert('Usuário excluído com sucesso!');
                setUsuarios(usuarios.filter(usuario => usuario.usuarioID !== usuarioID));
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir usuário');
        }
    };

    const editarUsuario = (usuarioID, usuarioNome, usuarioUsuario) => {
        navigate('/alterarUsuario', { state: { usuarioID, usuarioNome, usuarioUsuario } });
    }

    return (
        <div>
            <h1>Usuários Cadastrados</h1>
            <table border={1}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map((usuario) => (
                        <tr key={usuario.usuarioID}>
                            <td>{usuario.usuarioID}</td>
                            <td>{usuario.usuarioNome}</td>
                            <td>{usuario.usuarioUsuario}</td>
                            <td>
                                <button onClick={() => deletarUsuario(usuario.usuarioID)}>
                                    Excluir
                                </button>
                                <button onClick={() => editarUsuario(usuario.usuarioID, usuario.usuarioNome, usuario.usuarioUsuario)}>
                                    Editar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Link to={"/inicio"}>Início</Link>
        </div>
    );
}

export default TabelaUsuario;
