import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarSection({ appointments }) {
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = (appointments || []).map((a) => ({
    title: a.serviceName || (a.serviceId ? `Serviço #${a.serviceId}` : 'Horário ocupado'),
    start: new Date(a.dateTimeInit),
    end: new Date(a.dateTimeEnd),
  }));

  return (
    <div className="bg-white p-6 rounded-[30px] shadow-lg border w-full min-w-[350px]">
      <h2 className="text-center text-[#403934] font-semibold mb-4 text-xl">
        Agenda do Mês
      </h2>

      <div style={{ height: '70vh', minHeight: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={['month', 'week', 'day', 'agenda']}
          messages={{
            today: 'Hoje',
            previous: '<',
            next: '>',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            noEventsInRange: 'Nenhum agendamento.',
          }}
          popup
        />
      </div>
    </div>
  );
}
