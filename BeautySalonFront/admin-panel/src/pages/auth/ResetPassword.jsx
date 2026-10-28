import { API_URL } from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const email = location.state?.email;
  const code = location.state?.code;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/email/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });

      if (res.ok) {
        setSuccess('Senha redefinida com sucesso!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const msg = await res.text();
        setError(msg || 'Erro ao redefinir senha.');
      }
    } catch {
      setError('Erro de rede.');
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
          <h2 className="text-xl font-bold mt-2 text-[#574D47]">Nova Senha</h2>
          <p className="text-sm text-[#574D47]">Defina sua nova senha de acesso.</p>
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
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
          required
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-5 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
          required
        />

        <button
          type="submit"
          className="w-full bg-[#574D47] hover:bg-[#7A6F68] text-white font-bold py-2 rounded-full transition duration-200"
        >
          Redefinir Senha
        </button>

        <p className="text-sm text-center mt-4 text-[#494340]">
          <a href="/login" className="hover:underline">Voltar para login</a>
        </p>
      </form>
    </div>
  );
}
