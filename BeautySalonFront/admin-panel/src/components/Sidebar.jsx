import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: "/", label: "Dados" },
  { path: "/services", label: "Serviços" },
  { path: "/appointments", label: "Agendamentos" },
  { path: "/stock", label: "Estoque" }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className='hidden md:flex md:flex-col w-64 bg-gray-900 text-white h-screen fixed z-20'>
      <div className='p-6 text-2xl font-bold border-b border-gray-700'>Beauty Admin</div>
      <nav className='flex-1 p-4 space-y-2'>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded hover:bg-gray-700 transition ${
              location.pathname === item.path ? 'bg-gray-700 font-semibold' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}