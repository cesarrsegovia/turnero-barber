'use client';

import { useState, useEffect } from 'react';
import { generateDaySlots, getAppointmentsForDay, cancelAppointment, updateConfig, getConfig } from '@/actions/appointments';

import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz'; // Asegúrate de tener esto instalado
import AppointmentList from '@/components/AppointmentList';

type Appointment = {
  id: string;
  date: Date;
  isBooked: boolean;
  clientName: string | null;
};

export default function AdminDashboard() {
  // --- ESTADOS ---
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ startHour: 9, endHour: 18, interval: 30 });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    getConfig().then(data => setConfig(data));
  }, []);

  useEffect(() => {
    fetchSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function fetchSlots() {
    setLoading(true);
    const data = await getAppointmentsForDay(selectedDate);
    setSlots(data);
    setLoading(false);
  }

  const handleSaveConfig = async (formData: FormData) => {
    const res = await updateConfig(formData);
    if (res.success) {
      alert('Configuración actualizada.');
      setShowConfig(false);
      const newConfig = await getConfig();
      setConfig(newConfig);
    } else {
      alert('Error: ' + res?.error);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('¿Seguro que quieres generar los turnos para este día?')) return;
    setLoading(true);
    const res = await generateDaySlots(selectedDate);
    if (res.success) {
      alert(`¡Éxito! Se generaron ${res.count} turnos.`);
      fetchSlots();
    } else {
      alert('Error: ' + res.error);
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Liberar este turno?')) return;
    await cancelAppointment(id);
    fetchSlots();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <header className="mb-8 border-b border-barber-gray pb-4">
        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-400">Gestiona la disponibilidad de la barbería</p>
      </header>

      {/* LAYOUT 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Configuración */}
          <div>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="text-barber-orange text-sm underline hover:text-white transition-colors mb-4"
            >
              {showConfig ? 'Ocultar Configuración' : '⚙️ Configurar Horarios'}
            </button>

            {showConfig && (
              <form action={handleSaveConfig} className="bg-barber-gray/50 p-4 rounded-xl border border-barber-orange/30 flex flex-wrap gap-4 items-end animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Apertura</label>
                  <input name="startHour" type="number" defaultValue={config.startHour} min="0" max="23" className="bg-black p-2 rounded border border-gray-700 w-20 text-center text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Cierre</label>
                  <input name="endHour" type="number" defaultValue={config.endHour} min="0" max="23" className="bg-black p-2 rounded border border-gray-700 w-20 text-center text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Intervalo</label>
                  <select name="interval" defaultValue={config.interval} className="bg-black p-2 rounded border border-gray-700 w-24 text-center text-white">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <button type="submit" className="bg-barber-orange text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors text-sm font-bold h-10">
                  Guardar
                </button>
              </form>
            )}
          </div>

          {/* Selector y Botón */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <label className="text-sm font-semibold text-barber-lime">Seleccionar Fecha</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-barber-gray text-white p-3 rounded-lg border border-gray-600 focus:border-barber-green outline-none"
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || slots.length > 0}
              className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
            >
              {loading ? 'Procesando...' : '⚡ Abrir Día'}
            </button>
          </div>

          {/* Grilla de Turnos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              <span>📅</span>
              {/* 🔴 CORRECCIÓN CRÍTICA: Agregamos 'T00:00:00' para forzar hora local */}
              Turnos del <span className="text-barber-green capitalize">
                {formatInTimeZone(new Date(`${selectedDate}T00:00:00`), 'UTC', "EEEE dd 'de' MMMM", { locale: es })}
              </span>
            </h2>

            {slots.length === 0 && !loading && (
              <div className="p-10 border-2 border-dashed border-barber-gray rounded-xl text-center text-gray-500">
                No hay turnos generados para este día. <br/> ¡Presiona Abrir Día para comenzar!
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {slots.map((slot) => (
                <div 
                  key={slot.id}
                  className={`
                    relative p-3 rounded-xl border-2 flex flex-col items-center justify-center min-h-[110px] transition-all gap-1 group
                    ${slot.isBooked 
                      ? 'border-barber-red bg-barber-red/10' 
                      : 'border-barber-green bg-barber-green/10 hover:bg-barber-green/20'
                    }
                  `}
                >
                  {/* Hora: Usamos UTC para que muestre la hora exacta de la base de datos */}
                  <span className="text-xl font-bold text-white tracking-wide">
                    {formatInTimeZone(new Date(slot.date), 'UTC', 'HH:mm')}
                  </span>

                  <span className={`text-[10px] font-bold uppercase tracking-wider ${slot.isBooked ? 'text-barber-red' : 'text-barber-green'}`}>
                    {slot.isBooked ? 'Reservado' : 'Disponible'}
                  </span>

                  {slot.isBooked && (
                    <div className="mt-1 px-2 py-1 rounded bg-black/60 border border-white/10 w-full">
                      <p className="text-xs text-white text-center font-medium truncate">
                        {slot.clientName || "Cliente"}
                      </p>
                    </div>
                  )}

                  {slot.isBooked && (
                    <button 
                      onClick={() => handleCancel(slot.id)}
                      className="absolute -top-2 -right-2 bg-barber-red text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                      title="Cancelar reserva"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <AppointmentList />
          </div>
        </div>

      </div>
    </div>
  );
}