import { API_URL } from '../../utils/api';
// BookingPage.jsx atualizado com seleção de profissional
import { useState, useEffect } from 'react';
import CalendarSection from '../../components/CalendarSection';

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const tenantId = 1;

  useEffect(() => {
    fetch(`${API_URL}/api/service?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => setServices(data));

    fetch(`${API_URL}/api/appointment/busy?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => setAppointments(data));

    fetch(`${API_URL}/api/user/professionals?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => setProfessionals(data));
  }, []);

  useEffect(() => {
    if (!selectedService || !date || !selectedProfessional) {
      setAvailableTimes([]);
      return;
    }

    fetch(`${API_URL}/api/availability?providerId=${selectedProfessional}&serviceId=${selectedService}&date=${date}`)
      .then(res => res.json())
      .then(data => setAvailableTimes(data.availableSlots))
      .catch(() => setAvailableTimes([]));
  }, [selectedService, selectedProfessional, date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const appointment = {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      serviceId: parseInt(selectedService),
      professionalId: selectedProfessional,
      date,
      time,
      tenantId
    };

    const res = await fetch(`${API_URL}/api/appointment/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });

    if (res.ok) {
      setSuccess('Agendamento realizado com sucesso!');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setSelectedService('');
      setSelectedProfessional('');
      setDate('');
      setTime('');
      setAvailableTimes([]);
    } else {
      const msg = await res.text();
      setError(msg || 'Erro ao criar agendamento.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-start justify-center gap-10 px-6 py-12 max-w-[1600px] mx-auto">
      <form onSubmit={handleSubmit} className="bg-[#eae5df] rounded-[30px] shadow-xl p-8 w-full max-w-[450px] border border-gray-300">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#574d47]">Agende seu horário</h1>

        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full border rounded px-4 py-2 mb-4" required>
          <option value="">Selecione um serviço</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={selectedProfessional} onChange={(e) => setSelectedProfessional(e.target.value)} className="w-full border rounded px-4 py-2 mb-4" required>
          <option value="">Selecione um profissional</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded px-4 py-2 mb-4" required />

        <div className="mb-4">
          <p className="text-sm text-[#574d47] mb-2 font-medium">Horários disponíveis:</p>
          <div className="grid grid-cols-3 gap-2">
            {availableTimes.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-3">Nenhum horário disponível</p>
            ) : (
              availableTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`py-2 px-3 rounded-lg border text-sm transition ${
                    time === t
                      ? 'bg-[#574d47] text-white font-semibold'
                      : 'bg-white text-[#574d47] border-[#574d47] hover:bg-[#eee]'
                  }`}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </div>

        <input type="text" placeholder="Seu nome" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border rounded px-4 py-2 mb-4" required />
        <input type="email" placeholder="Seu e-mail" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full border rounded px-4 py-2 mb-4" required />
        <input type="tel" placeholder="Seu telefone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full border rounded px-4 py-2 mb-6" required />

        <button type="submit" className="w-full bg-[#574D47] text-white py-2 rounded-full hover:bg-[#7A6F68] transition font-semibold">
          Confirmar Agendamento
        </button>
      </form>

      <div className="flex-1 w-full">
        <CalendarSection appointments={appointments} />
      </div>
    </div>
  );
}
