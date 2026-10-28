import { API_URL, authFetch } from '../../utils/api';
import { useEffect, useState } from 'react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', description: '', durationMin: '', price: '' });
  const [search, setSearch] = useState('');
  const tenantId = 1;

  async function fetchServices() {
    try {
      const res = await authFetch(`${API_URL}/api/service?tenantId=${tenantId}`);
      const data = await res.json();
      setServices(data);
      setFiltered(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setFiltered(
      services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, services]);

  async function handleSubmit(e) {
    e.preventDefault();
    const isNew = form.id == null;

    const model = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationMin: parseInt(form.durationMin, 10),
      price: parseFloat(form.price),
      tenantId
    };

    if (!isNew) model.id = form.id;

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew
      ? `${API_URL}/api/service`
      : `${API_URL}/api/service/${form.id}`;

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });

      if (res.ok) {
        setForm({ id: null, name: '', description: '', durationMin: '', price: '' });
        setShowForm(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  }

  function handleEdit(s) {
    setForm({ ...s });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir este serviço?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/service/${id}`, { method: 'DELETE' });
      if (res.ok) fetchServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-bold text-black">Serviços</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full sm:w-64"
          />
          <button
            onClick={() => {
              setForm({ id: null, name: '', description: '', durationMin: '', price: '' });
              setShowForm(true);
            }}
            className="bg-[#2bb00e] text-white px-4 py-2 rounded hover:bg-[#289c0d]"
          >
            + Novo Serviço
          </button>
        </div>
      </div>

      <table className="w-full bg-white rounded shadow overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-center p-3">Nome</th>
            <th className="text-center p-3">Descrição</th>
            <th className="text-center p-3">Duração</th>
            <th className="text-center p-3">Preço</th>
            <th className="text-center p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{s.name}</td>
              <td className="p-3">{s.description}</td>
              <td className="p-3">{s.durationMin} min</td>
              <td className="p-3">R$ {s.price.toFixed(2)}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => handleEdit(s)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full text-sm transition"
                  title="Editar"
                >
                  ✏️
                </button>

                <button
                  onClick={() => handleDelete(s.id)}
                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full text-sm transition"
                  title="Excluir"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{form.id == null ? 'Novo Serviço' : 'Editar Serviço'}</h3>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input type="text" placeholder="Nome" className="w-full border rounded px-3 py-2" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input type="text" placeholder="Descrição" className="w-full border rounded px-3 py-2"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input type="number" placeholder="Duração (min)" className="w-full border rounded px-3 py-2" required
                value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} />
              <input type="number" step="0.01" placeholder="Preço (R$)" className="w-full border rounded px-3 py-2" required
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-[#2bb00e] text-white px-4 py-2 rounded hover:bg-[#289c0d]">
                  {form.id == null ? 'Salvar' : 'Atualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
