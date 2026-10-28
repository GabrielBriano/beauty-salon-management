import { API_URL } from '../../utils/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro de conexão com o servidor.');
    }
  }

  return (
    <div
      className="relative z-10 min-h-screen flex items-center justify-center bg-cover bg-center"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#f8f3ef] rounded-[30px] shadow-lg p-10 w-full max-w-md border border-brown-300"
      >
        <div className="flex flex-col items-center mb-3">
          <img
            src="/src/assets/avatar.webp" 
            alt="Logo"
            className="w-20 h-20 rounded-full border mb-2" 
          /> 
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full bg-[#FFFFFF] border border-[#3b3e5e] rounded px-4 py-2 mb-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="w-full bg-[#FFFFFF] border border-[#3b3e5e] rounded px-4 py-2 mb-5 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-[#574D47] hover:bg-[#7A6F68] transition-all duration-200 text-white font-bold py-2 rounded-full"
        >
          Entrar
        </button>

        <p className="text-sm text-center mt-4 text-[#494340]">
          Não tem uma conta?{' '}
          <a href="/register" className="text-[#2c2c2c] font-medium hover:underline">
            Criar conta
          </a>
        </p>

        <div className="text-center mt-3">
          <a href="/forgot-password" className="text-sm text-[#494340] hover:underline">
            Esqueceu a senha?
          </a>
        </div>
      </form>
    </div>
  );
}