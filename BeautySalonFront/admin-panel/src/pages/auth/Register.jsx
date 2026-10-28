import { API_URL } from '../../utils/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const model = {
      name: form.name,
      email: form.email,
      password: form.password,
      type: 'Client',
      tenantId: 1
    };

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });

      if (res.ok) {
        setSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const msg = await res.text();
        setError(msg || 'Erro ao criar conta.');
      }
    } catch {
      setError('Erro de rede. Tente novamente.');
    }
  }

  return (
    <div
      className="relative z-10 min-h-screen flex items-center justify-center bg-cover bg-center"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#eae5df] rounded-[30px] shadow-lg p-10 w-full max-w-md border border-gray-300"
      >
        <div className="flex flex-col items-center mb-6">
          <img
            src="/src/assets/avatar.webp"
            alt="Logo"
            className="w-20 h-20 rounded-full border mb-2"
          />
          <h2 className="text-xl font-bold mt-2 text-[#574D47]">Criar Conta</h2>
          <p className="text-sm text-[#574D47]">Preencha os dados para se cadastrar.</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm text-center">
            {success}
          </div>
        )}

        <input
          type="text"
          placeholder="Nome completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
        />
        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
        />
        <input
          type="password"
          placeholder="Confirmar senha"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-5 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
        />

        <button
          type="submit"
          className="w-full bg-[#574D47] hover:bg-[#7A6F68] transition-all duration-200 text-white font-bold py-2 rounded-full"
        >
          Criar Conta
        </button>

        <p className="text-sm text-center mt-4 text-[#494340]">
          Já tem conta?{' '}
          <a href="/login" className="text-[#2c2c2c] font-medium hover:underline">
            Entrar
          </a>
        </p>
      </form>
    </div>
  );
}
