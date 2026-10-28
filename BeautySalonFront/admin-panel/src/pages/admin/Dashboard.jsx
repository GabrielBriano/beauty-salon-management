import { API_URL, authFetch } from '../../utils/api';
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  format, parseISO, subDays, startOfDay, endOfDay,
  isWithinInterval, addDays, differenceInCalendarDays
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const TENANT_ID = 1;
const API = `${API_URL}/api`;

const COLORS = ['#574d47', '#e5a79f', '#d2c8bd', '#bdaea2', '#8b817a', '#2bb00e', '#ff7f0e'];

const currencyBR = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDateTimeBR = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} - ${hora}`;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtro de período
  const [rangeKey, setRangeKey] = useState('7d'); // 'today' | '7d' | '30d' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dRes, aRes] = await Promise.all([
          authFetch(`${API}/dashboard?tenantId=${TENANT_ID}`),
          authFetch(`${API}/appointment?tenantId=${TENANT_ID}`)
        ]);
        const [dJson, aJson] = await Promise.all([dRes.json(), aRes.json()]);
        if (!mounted) return;
        setData(dJson);
        setAppointments(Array.isArray(aJson) ? aJson : []);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Resolve datas início/fim do filtro selecionado
  const { from, to } = useMemo(() => {
    const today = new Date();
    if (rangeKey === 'today') {
      return { from: startOfDay(today), to: endOfDay(today) };
    }
    if (rangeKey === '7d') {
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    }
    if (rangeKey === '30d') {
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }
    // custom
    const f = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(today);
    const t = customTo ? endOfDay(new Date(customTo)) : endOfDay(today);
    return { from: f, to: t };
  }, [rangeKey, customFrom, customTo]);

  // Agendamentos dentro do período
  const apptsInRange = useMemo(() => {
    return appointments.filter(a => {
      const d = a.dateTimeInit ? new Date(a.dateTimeInit) : null;
      return d && isWithinInterval(d, { start: from, end: to });
    });
  }, [appointments, from, to]);

  // Barras: agendamentos por dia (no período)
  const dailySeries = useMemo(() => {
    const days = Math.max(1, Math.min(60, differenceInCalendarDays(endOfDay(to), startOfDay(from)) + 1));
    const base = [];
    for (let i = 0; i < days; i++) base.push(addDays(startOfDay(from), i));

    const map = new Map(base.map(d => [format(d, 'yyyy-MM-dd'), 0]));
    apptsInRange.forEach(a => {
      const key = format(new Date(a.dateTimeInit), 'yyyy-MM-dd');
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([iso, count]) => ({
      iso,
      label: format(parseISO(iso), 'dd/MM', { locale: ptBR }),
      count
    }));
  }, [apptsInRange, from, to]);

  // Pizza: serviços mais solicitados (no período)
  const pieData = useMemo(() => {
    const byService = new Map();
    apptsInRange.forEach(a => {
      const name = a.serviceName ?? `ID ${a.serviceId}`;
      byService.set(name, (byService.get(name) || 0) + 1);
    });
    const arr = Array.from(byService.entries()).map(([name, count]) => ({ name, count }));
    arr.sort((a, b) => b.count - a.count);
    const top = arr.slice(0, 5);
    const rest = arr.slice(5);
    const others = rest.reduce((s, r) => s + r.count, 0);
    if (others > 0) top.push({ name: 'Outros', count: others });
    return top;
  }, [apptsInRange]);

  // Próximos agendamentos (sempre futuros)
  const upcoming = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => a.dateTimeInit && new Date(a.dateTimeInit) >= now)
      .sort((a, b) => new Date(a.dateTimeInit) - new Date(b.dateTimeInit))
      .slice(0, 8)
      .map(a => ({
        id: a.id,
        when: fmtDateTimeBR(a.dateTimeInit),
        client: a.clientName ?? a.clientId,
        professional: a.professionalName ?? a.professionalId,
        service: a.serviceName ?? `ID ${a.serviceId}`,
        status: a.status ?? 'Pendente'
      }));
  }, [appointments]);

  if (loading || !data) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* KPIs + filtro */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-1">
          <KpiCard title="Agendamentos Hoje" value={data.appointmentsTodayCount} />
          <KpiCard title="Faturamento Estimado Hoje" value={currencyBR(data.totalRevenueToday)} valueClass="text-green-600" />
          <KpiCard title="Total de Produtos em Estoque" value={data.totalStockQuantity} valueClass="text-orange-500" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">Período:</label>
          <select
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="custom">Personalizado</option>
          </select>

          {rangeKey === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </>
          )}

          <span className="text-xs text-gray-500 ml-auto">
            {format(from, 'dd/MM/yyyy')} — {format(to, 'dd/MM/yyyy')}
          </span>
        </div>
      </div>

      {/* Gráficos + próximos */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Pizza */}
        <Card title="Serviços mais solicitados (no período)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip />
              <Pie data={pieData} dataKey="count" nameKey="name" outerRadius={110}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {pieData.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">Sem dados no período.</p>
          )}
        </Card>

        {/* Barras */}
        <Card title="Agendamentos por dia (no período)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Agendamentos" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Próximos agendamentos */}
        <Card title="Próximos agendamentos">
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">Sem agendamentos futuros.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map(item => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.client} <span className="text-gray-400">•</span> {item.service}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.when} <span className="text-gray-400">•</span> {item.professional}
                    </div>
                  </div>
                  <span
                    className={
                      "text-xs px-2 py-1 rounded-full whitespace-nowrap " +
                      (item.status?.toLowerCase() === "concluído" || item.status?.toLowerCase() === "concluido"
                        ? "bg-green-100 text-green-700"
                        : item.status?.toLowerCase() === "cancelado"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }
                    title={item.status}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* UI */
function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-600">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function KpiCard({ title, value, valueClass = 'text-[#574d47]' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-1 text-3xl font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}
