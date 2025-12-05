'use client';

import { useState, useEffect } from 'react';
import { getAppointmentsForDay, bookAppointment } from '@/actions/appointments';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

type Appointment = {
  id: string;
  date: Date;
  isBooked: boolean;
};

export default function ClientBooking() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para el modal de reserva
  const [bookingSlot, setBookingSlot] = useState<Appointment | null>(null);
  const [clientName, setClientName] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  async function fetchSlots() {
    setLoading(true);
    const data = await getAppointmentsForDay(selectedDate);
    setSlots(data);
    setLoading(false);
  }

  const handleSlotClick = (slot: Appointment) => {
    if (slot.isBooked) return; // Si está ocupado, no hacemos nada
    setBookingSlot(slot); // Abrimos el "modal" con este turno
    setClientName(''); // Limpiamos el nombre anterior
  };

  const confirmBooking = async () => {
    if (!bookingSlot || !clientName.trim()){
      toast.error('Por favor, ingresa tu nombre para reservar el turno.');
      return;
    }

    setBookingLoading(true);
    const promise = bookAppointment(bookingSlot.id, clientName);

    toast.promise(promise, {
      loading: 'Reservando tu lugar...',
      success: (data) => {
        if (data.success) {
          setBookingSlot(null);
          fetchSlots();
          return `¡Listo ${clientName}! Te esperamos a las ${formatInTimeZone(new Date(bookingSlot.date), 'UTC', "EEEE dd 'de' MMMM - HH:mm", { locale: es })}`;
        } else {
          throw new Error(data.error);
        }
      },
      error: (err) => `Error: ${err.message}`,
    });
    // limpiamos el estado de carga al final si es necesario
    try {
      await promise;
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-5xl mx-auto">
      {/* Header Simple */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Barber Shop</h1>
          <p className="text-barber-green text-sm">Reserva tu estilo</p>
        </div>
        <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors">
          Soy Admin
        </Link>
      </header>

      {/* Selector de Fecha */}
      <div className="mb-8">
        <label className="block text-gray-400 mb-2 text-sm uppercase tracking-wider">Elige un día</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-barber-gray text-white p-4 rounded-xl border border-gray-700 w-full md:w-auto text-lg focus:border-barber-green outline-none"
        />
      </div>

      {/* GRILLA DE HORARIOS */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading ? (
          <p className="text-gray-500 col-span-full text-center py-10">Cargando horarios...</p>
        ) : slots.length === 0 ? (
          <div className="col-span-full text-center py-10 border border-dashed border-gray-800 rounded-lg">
            <p className="text-gray-500">No hay turnos disponibles para esta fecha.</p>
            <p className="text-xs text-gray-600 mt-1">Intenta seleccionar otro día.</p>
          </div>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot)}
              disabled={slot.isBooked}
              className={`
    group relative p-4 rounded-lg border-2 transition-all duration-200
    flex flex-col items-center justify-center h-24
    ${slot.isBooked
                  ? 'border-barber-red bg-barber-red/20 cursor-not-allowed' // 🔴 CAMBIO: Ahora usa rojo y fondo rojizo
                  : 'border-barber-green bg-black hover:bg-barber-green hover:text-black cursor-pointer'
                }
  `}
            >
              <span className={`text-lg font-bold ${slot.isBooked ? 'text-barber-red' : 'text-white group-hover:text-black'}`}>
                {/* 🔴 CAMBIO: El texto de la hora también se pone rojo si está ocupado */}
                {formatInTimeZone(new Date(slot.date), 'UTC', 'HH:mm')}
              </span>
              <span className={`text-[10px] uppercase mt-1 font-bold ${slot.isBooked ? 'text-barber-red' : 'text-gray-400 group-hover:text-black'}`}>
                {slot.isBooked ? 'Ocupado' : 'Disponible'}
              </span>
            </button>
          ))
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN (Overlay simple) */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-barber-gray p-6 rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Confirmar Turno</h3>
            <p className="text-barber-green mb-6">
              {formatInTimeZone(new Date(bookingSlot.date), 'UTC', "EEEE dd 'de' MMMM - HH:mm", { locale: es })} hs
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tu Nombre</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-black p-3 rounded-lg text-white border border-gray-600 focus:border-barber-orange outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setBookingSlot(null)}
                  className="flex-1 py-3 rounded-lg bg-transparent border border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBooking}
                  disabled={bookingLoading}
                  className="flex-1 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
                >
                  {bookingLoading ? 'Reservando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}