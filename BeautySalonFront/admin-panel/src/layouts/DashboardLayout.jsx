import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import avatar from "../assets/avatar.webp";

export default function DashboardLayout() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const name = storedUser?.name || "Usuário";
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  // remove qualquer bg global quando estiver no admin
  useEffect(() => {
    document.body.classList.add("admin-page");
    return () => document.body.classList.remove("admin-page");
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-gray-200 flex flex-col justify-between items-center">
        <div className="w-full flex flex-col items-center p-6">
          <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full border mb-2" />
          <p className="text-center text-sm font-medium mb-4">{name}</p>
          <nav className="flex flex-col w-full gap-3">
            <Link to="/" className="bg-[#d2c8bd] hover:bg-[#c5b7a6] text-center py-2 rounded-full font-medium transition">Dados</Link>
            <Link to="/services" className="bg-[#d2c8bd] hover:bg-[#c5b7a6] text-center py-2 rounded-full font-medium transition">Serviços</Link>
            <Link to="/appointments" className="bg-[#d2c8bd] hover:bg-[#c5b7a6] text-center py-2 rounded-full font-medium transition">Agendamentos</Link>
            <Link to="/stock" className="bg-[#d2c8bd] hover:bg-[#c5b7a6] text-center py-2 rounded-full font-medium transition">Estoque</Link>
          </nav>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-[#574d47] text-white py-4 px-8 text-xl font-bold flex justify-between items-center border-b border-[#4a413b]">
          <span>Painel administrativo</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
          >
            Sair
          </button>
        </header>

        <motion.main
          className="flex-1 overflow-auto p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}