'use client'; // 👈 Obligatorio para usar useState, useEffect y onClick

import { useState, useEffect } from 'react';
import { generateDaySlots, getAppointmentsForDay, cancelAppointment } from '@/actions/appointments'; // Importamos tus acciones
import { format } from 'date-fns'; // Para formatear fechas bonito
import { es } from 'date-fns/locale'; // Español para los días

// Definimos el tipo de dato que esperamos (Typescript fuerte 💪)
type Appointment = {
  id: string;
  date: Date;
  isBooked: boolean;
  clientName: string | null;
};

export default function AdminDashboard() {
  // --- ESTADOS (La memoria del componente) ---
  // Iniciamos con la fecha de hoy formateada para el input HTML (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // --- EFECTOS (Lo que pasa automáticamente) ---
  // Cada vez que cambie la fecha (selectedDate), buscamos los turnos
  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  // Función auxiliar para cargar datos
  async function fetchSlots() {
    setLoading(true);
    const data = await getAppointmentsForDay(selectedDate);
    setSlots(data);
    setLoading(false);
  }

  // --- MANEJADORES DE EVENTOS (Los botones) ---
  const handleGenerate = async () => {
    if (!confirm('¿Seguro que quieres generar los turnos para este día?')) return;

    setLoading(true);
    const res = await generateDaySlots(selectedDate);
    if (res.success) {
      alert(`¡Éxito! Se generaron ${res.count} turnos.`);
      fetchSlots(); // Recargamos la lista
    } else {
      alert('Error: ' + res.error);
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Liberar este turno?')) return;
    await cancelAppointment(id);
    fetchSlots(); // Recargar visualmente
  };

  // --- RENDERIZADO (Lo que se ve) ---
  return (
    <div className="min-h-screen p-8 font-sans">
      {/* Encabezado */}
      <header className="mb-8 border-b border-barber-gray pb-4">
        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-400">Gestiona la disponibilidad de la barbería</p>
      </header>

      {/* Controles Principales */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">

        {/* Selector de Fecha */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-sm font-semibold text-barber-lime">Seleccionar Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-barber-gray text-white p-3 rounded-lg border border-gray-600 focus:border-barber-green outline-none"
          />
        </div>

        {/* Botón Generar */}
        <button
          onClick={handleGenerate}
          disabled={loading || slots.length > 0} // Desactivar si ya hay turnos
          className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Procesando...' : '⚡ Abrir Día (Generar Turnos)'}
        </button>
      </div>

      {/* Visualización de Turnos (El Grid) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Turnos del: <span className="text-barber-green capitalize">
            {format(new Date(selectedDate), "EEEE dd 'de' MMMM", { locale: es })}
          </span>
        </h2>

        {/* Estado Vacío */}
        {slots.length === 0 && !loading && (
          <div className="p-10 border-2 border-dashed border-barber-gray rounded-xl text-center text-gray-500">
            No hay turnos generados para este día. <br />
            ¡Presiona Abrir Día para comenzar!
          </div>
        )}

        {/* GRILLA DE TURNOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`
                relative p-3 rounded-xl border-2 flex flex-col items-center justify-centermin-h-[110px] transition-all gap-1
                ${slot.isBooked
                  ? 'border-barber-red bg-barber-red/10' // Estilo Ocupado
                  : 'border-barber-green bg-barber-green/10 hover:bg-barber-green/20' // Estilo Libre
                }
              `}
            >
              {/* Hora */}
              <span className="text-xl font-bold text-white tracking-wide">
                {format(new Date(slot.date), 'HH:mm')}
              </span>

              {/* Estado Texto */}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${slot.isBooked ? 'text-barber-red' : 'text-barber-green'}`}>
                {slot.isBooked ? 'Reservado' : 'Disponible'}
              </span>

              {/* Nombre del cliente (Corrección de visibilidad) */}
              {slot.isBooked && (
                <div className="mt-1 px-2 py-1 rounded bg-black/40 border border-white/10 w-full">
                  <p className="text-xs text-white text-center font-medium truncate">
                    {slot.clientName || "Cliente"} {/* Muestra "Cliente" si el nombre está vacío */}
                  </p>
                </div>
              )}

              {/* Acción de Cancelar (Solo si está reservado) */}
              {slot.isBooked && (
                <button
                  onClick={() => handleCancel(slot.id)}
                  className="absolute -top-2 -right-2 bg-barber-red text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
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
  );
}