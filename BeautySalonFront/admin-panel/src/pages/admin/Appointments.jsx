import { API_URL, authFetch } from '../../utils/api';
import { useEffect, useState } from 'react';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // listas para os selects
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [form, setForm] = useState({
    id: null,
    clientId: '',
    clientName: '',
    professionalId: '',
    serviceId: '',
    serviceName: '',
    date: '',
    time: '',
    observations: ''
  });

  const tenantId = 1; // ajuste conforme seu contexto

  // ---- Helpers ------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, '0');

  const formatDateBR = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const d = date.toLocaleDateString('pt-BR');
    const t = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${d} - ${t}`;
  };

  function buildLocalDateFromForm(dateStr, timeStr) {
    // dateStr: YYYY-MM-DD | timeStr: HH:mm
    const [y, m, d] = (dateStr || '').split('-').map(Number);
    const [hh, mm] = (timeStr || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0); // local time
  }

  function toOffsetString(d) {
    // "YYYY-MM-DDTHH:mm:00±hh:mm" preservando o fuso local (ex.: -03:00)
    const offMin = -d.getTimezoneOffset();
    const sign = offMin >= 0 ? '+' : '-';
    const abs = Math.abs(offMin);
    const oh = pad(Math.floor(abs / 60));
    const om = pad(abs % 60);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${oh}:${om}`;
  }

  function toLocalDateParts(isoLike) {
    // Converte string ISO/Offset em partes locais YYYY-MM-DD e HH:mm
    const d = new Date(isoLike);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
  }

  // ---- API ----------------------------------------------------------------
  async function fetchAppointments() {
    try {
      const res = await authFetch(`${API_URL}/api/appointment?tenantId=${tenantId}`, {
        headers: { 'Cache-Control': 'no-store' }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setAppointments(list);
      setFiltered(list);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setAppointments([]);
      setFiltered([]);
    }
  }

  async function fetchLists() {
    setLoadingLists(true);
    try {
      const [pRes, sRes] = await Promise.all([
        authFetch(`${API_URL}/api/user/professionals?tenantId=${tenantId}`),
        authFetch(`${API_URL}/api/service?tenantId=${tenantId}`)
      ]);
      const [pJson, sJson] = await Promise.all([pRes.json(), sRes.json()]);
      setProfessionals(Array.isArray(pJson) ? pJson : []);
      setServices(Array.isArray(sJson) ? sJson : []);
    } catch (err) {
      console.error('Erro ao carregar listas:', err);
      setProfessionals([]);
      setServices([]);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
    fetchLists();
  }, []);

  useEffect(() => {
    const qRaw = search.trim();
    const normalize = (s) => (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const q = normalize(qRaw);
    if (!q) { setFiltered(appointments); return; }

    setFiltered(
      appointments.filter((a) => {
        const br = formatDateBR(a.dateTimeInit);
        const hay = normalize([
          a.clientName, a.clientId,
          a.professionalName, a.serviceName,
          a.observations, a.dateTimeInit, br
        ].join(' '));
        return hay.includes(q);
      })
    );
  }, [search, appointments]);

  // ---- Submit --------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const dLocal = buildLocalDateFromForm(form.date, form.time);   // local

    const model = {
      id: form.id,
      // Preferir o nome digitado; se tiver ID real, pode manter em clientId
      clientId: (form.clientName || form.clientId || '').trim(),
      clientName: (form.clientName || '').trim(),
      professionalId: (form.professionalId || '').trim(),
      serviceId: form.serviceId ? parseInt(form.serviceId, 10) : null,
      dateTimeInit: toOffsetString(dLocal), // ✅ preserva fuso local
      status: 'Pendente',
      observations: (form.observations || '').trim(),
      tenantId
    };

    if (!model.clientId)       { alert('Informe o nome do cliente'); return; }
    if (!model.professionalId) { alert('Selecione um profissional'); return; }
    if (!model.serviceId)      { alert('Selecione um serviço'); return; }
    if (isNaN(dLocal.getTime())) { alert('Data/hora inválidas'); return; }

    const method = form.id == null ? 'POST' : 'PUT';
    const url = form.id == null
      ? `${API_URL}/api/appointment?tenantId=${tenantId}`
      : `${API_URL}/api/appointment/${form.id}?tenantId=${tenantId}`;

    try {
      const res = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': String(tenantId),
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify(model),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '(sem corpo)');
        console.error('Falha ao salvar agendamento:', res.status, text);
        alert('Não foi possível salvar o agendamento.\n' + text);
        return;
      }

      // sucesso
      setForm({
        id: null,
        clientId: '',
        clientName: '',
        professionalId: '',
        serviceId: '',
        serviceName: '',
        date: '',
        time: '',
        observations: ''
      });
      setShowForm(false);
      fetchAppointments();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      alert('Erro de rede ao salvar o agendamento.');
    }
  }

  // ---- Edit/Delete ---------------------------------------------------------
  function handleEdit(a) {
    const { date, time } = toLocalDateParts(a.dateTimeInit); // ✅ local
    setForm({
      id: a.id,
      clientId: a.clientId || '',
      clientName: a.clientName || a.clientId || '',
      professionalId: a.professionalId || '',
      serviceId: a.serviceId || '',
      serviceName: a.serviceName || '',
      date,
      time,
      observations: a.observations || ''
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir este agendamento?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/appointment/${id}?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Id': String(tenantId) },
      });
      if (res.ok) fetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  }

  // ---- UI ------------------------------------------------------------------
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-bold text-black">Agendamentos</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por agendamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full sm:w-64"
          />
          <button
            onClick={() => {
              setForm({
                id: null,
                clientId: '',
                clientName: '',
                professionalId: '',
                serviceId: '',
                serviceName: '',
                date: '',
                time: '',
                observations: ''
              });
              if (!professionals.length || !services.length) fetchLists();
              setShowForm(true);
            }}
            className="bg-[#2bb00e] text-white px-4 py-2 rounded hover:bg-[#289c0d]"
          >
            + Novo Agendamento
          </button>
        </div>
      </div>

      <table className="w-full bg-white rounded shadow overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-center p-3">Cliente</th>
            <th className="text-center p-3">Profissional</th>
            <th className="text-center p-3">Serviço</th>
            <th className="text-center p-3">Início</th>
            <th className="text-center p-3">Observações</th>
            <th className="text-center p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-3 text-center">{a.clientName || a.clientId}</td>
              <td className="p-3 text-center">{a.professionalName || a.professionalId}</td>
              <td className="p-3 text-center">{a.serviceName || a.serviceId}</td>
              <td className="p-3 text-center">{formatDateBR(a.dateTimeInit)}</td>
              <td className="p-3 text-center">{a.observations}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full text-sm transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
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
              {form.id ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Nome do Cliente"
                className="w-full border rounded px-3 py-2"
                required
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              />

              <select
                className="w-full border rounded px-3 py-2"
                required
                value={form.serviceId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const svc = services.find(s => String(s.id) === String(id));
                  setForm(f => ({
                    ...f,
                    serviceId: id,
                    serviceName: svc?.name || ''
                  }));
                }}
                disabled={loadingLists}
              >
                <option value="">
                  {loadingLists ? 'Carregando serviços...' : 'Selecione um serviço'}
                </option>
                {(services || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                className="w-full border rounded px-3 py-2"
                required
                value={form.professionalId}
                onChange={(e) => setForm({ ...form, professionalId: e.target.value })}
                disabled={loadingLists}
              >
                <option value="">
                  {loadingLists ? 'Carregando profissionais...' : 'Selecione um profissional'}
                </option>
                {(professionals || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />

              <textarea
                placeholder="Observações"
                className="w-full border rounded px-3 py-2"
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">
                  Cancelar
                </button>
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
