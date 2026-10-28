import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-16 bg-white shadow-md flex items-center justify-between px-4 md:ml-64 bg-[#0D1321]">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="mr-4 md:hidden text-gray-600 hover:text-black"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        <h1 className="text-lg font-medium text-gray-800">Painel Administrativo</h1>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600 transition"
      >
        Sair
      </button>
    </header>
  );
}
