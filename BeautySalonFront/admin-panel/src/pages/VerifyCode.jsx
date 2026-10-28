import { API_URL } from '../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function VerifyCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/email/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (res.ok) {
        setSuccess('Código verificado com sucesso!');
        setTimeout(() => {
          navigate('/reset-password', { state: { email, code } });
        }, 1500);
      } else {
        const msg = await res.text();
        setError(msg || 'Código inválido.');
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
          <h2 className="text-xl font-bold mt-2 text-[#574D47]">Verificar Código</h2>
          <p className="text-sm text-[#574D47]">Digite o código enviado para seu e-mail.</p>
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
          placeholder="Código de verificação"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-white border border-[#3b3e5e] rounded px-4 py-2 mb-5 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#9f9180]"
          required
        />

        <button
          type="submit"
          className="w-full bg-[#574D47] hover:bg-[#7A6F68] text-white font-bold py-2 rounded-full transition duration-200"
        >
          Verificar
        </button>

        <p className="text-sm text-center mt-4 text-[#494340]">
          <a href="/forgot-password" className="hover:underline">Voltar</a>
        </p>
      </form>
    </div>
  );
}
