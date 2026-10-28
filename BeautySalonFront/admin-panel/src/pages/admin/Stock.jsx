import { API_URL, authFetch } from '../../utils/api';
import { useEffect, useState } from 'react';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    productName: '',
    unitMeasure: '',
    category: '',
    quantity: ''
  });
  const tenantId = 1;

  async function fetchStock() {
    try {
      const res = await authFetch(`${API_URL}/api/stock?tenantId=${tenantId}`);
      const data = await res.json();
      setProducts(data);
      setFiltered(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    }
  }

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    setFiltered(
      products.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, products]);

  async function handleSubmit(e) {
    e.preventDefault();

    const model = {
      productName: form.productName,
      unitMeasure: form.unitMeasure,
      category: form.category,
      quantity: parseInt(form.quantity, 10),
      tenantId
    };

    const method = form.id == null ? 'POST' : 'PUT';
    const url = form.id
      ? `${API_URL}/api/stock/${form.id}`
      : `${API_URL}/api/stock`;

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'PUT' ? { ...model, id: form.id } : model)
      });

      if (res.ok) {
        setForm({
          id: null,
          productName: '',
          unitMeasure: '',
          category: '',
          quantity: ''
        });
        setShowForm(false);
        fetchStock();
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  }

  function handleEdit(p) {
    setForm({ ...p });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir este produto?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/stock/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchStock();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-bold text-black">Estoque</h2>
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
              setForm({
                id: null,
                productName: '',
                unitMeasure: '',
                category: '',
                quantity: ''
              });
              setShowForm(true);
            }}
            className="bg-[#2bb00e] text-white px-4 py-2 rounded hover:bg-[#289c0d]"
          >
            + Novo Produto
          </button>
        </div>
      </div>

      <table className="w-full bg-white rounded shadow overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-center p-3">Produto</th>
            <th className="text-center p-3">Unidade</th>
            <th className="text-center p-3">Categoria</th>
            <th className="text-center p-3">Quantidade</th>
            <th className="text-center p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{p.productName}</td>
              <td className="p-3">{p.unitMeasure}</td>
              <td className="p-3">{p.category}</td>
              <td className="p-3">{p.quantity}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full text-sm transition"
                  title="Editar"
                >
                  ✏️
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
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
            <h3 className="text-lg font-bold mb-4">
              {form.id ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Produto"
                className="w-full border rounded px-3 py-2"
                required
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Unidade de Medida"
                className="w-full border rounded px-3 py-2"
                required
                value={form.unitMeasure}
                onChange={(e) => setForm({ ...form, unitMeasure: e.target.value })}
              />
              <input
                type="text"
                placeholder="Categoria"
                className="w-full border rounded px-3 py-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                type="number"
                placeholder="Quantidade"
                className="w-full border rounded px-3 py-2"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#2bb00e] text-white px-4 py-2 rounded hover:bg-[#289c0d]"
                >
                  {form.id ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}