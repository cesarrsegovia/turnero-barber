'use client';

import { useState, useEffect } from 'react';
import { searchAppointments, cancelAppointment } from '@/actions/appointments';
import { formatInTimeZone } from 'date-fns-tz'; // 👈 Usamos date-fns-tz
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AppointmentList() {
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
  };
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchAppointments(query);
      if (res.success) setAppointments(res.data || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleCancel = async (id: string) => {
    if(!confirm('¿Cancelar esta reserva?')) return;
    const res = await cancelAppointment(id);
    if(res.success) {
      toast.success('Reserva cancelada');
      const updated = await searchAppointments(query);
      if(updated.success) setAppointments(updated.data || []);
    } else {
      toast.error('Error al cancelar');
    }
  };

  return (
    <div className="bg-barber-gray/30 border border-white/10 rounded-xl p-6 h-full">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📅</span> Próximos Clientes
      </h2>

      <input 
        type="text" 
        placeholder="Buscar por nombre..." 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white mb-4 focus:border-barber-orange outline-none text-sm"
      />

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <p className="text-gray-500 text-center text-sm">Buscando...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No hay reservas futuras {query && 'con ese nombre'}.</p>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="bg-black/40 border border-gray-800 p-3 rounded-lg flex justify-between items-center hover:border-barber-green/50 transition-colors group">
              <div>
                <p className="font-bold text-white text-sm">{appt.clientName}</p>
                {/* 🔴 CORRECCIÓN: Usamos UTC para mostrar la fecha real de la base de datos */}
                <p className="text-barber-green text-xs capitalize">
                  {formatInTimeZone(new Date(appt.date), 'UTC', "EEEE dd MMM - HH:mm", { locale: es })}
                </p>
              </div>
              
              <button 
                onClick={() => handleCancel(appt.id)}
                className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Cancelar reserva"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}