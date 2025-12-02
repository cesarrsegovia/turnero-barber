'use server'; // 👈 Esto marca que todo este archivo se ejecuta en el servidor

import prisma from '@/lib/prisma';
import { addMinutes, setHours, setMinutes, startOfDay, endOfDay, isBefore } from 'date-fns';
import { revalidatePath } from 'next/cache';

// --- LÓGICA 1: GENERAR TURNOS (Para el Admin) ---
// Esta función crea "huecos" vacíos para un día específico.
// Ej: Generar slots para el "2025-12-01" cada 30 mins de 9am a 6pm.
export async function generateDaySlots(dateString: string) {
  try {
    const baseDate = new Date(dateString);
    
    // Configuración de la Barbería (Podría venir de una DB de config)
    const WORK_START_HOUR = 9; // 09:00
    const WORK_END_HOUR = 18;  // 18:00
    const DURATION_MINUTES = 30; 

    // Definimos el inicio y fin del día laboral
    let currentTime = setMinutes(setHours(baseDate, WORK_START_HOUR), 0);
    const endTime = setMinutes(setHours(baseDate, WORK_END_HOUR), 0);

    const slotsToCreate = [];

    // Bucle: Mientras la hora actual sea menor al cierre...
    while (isBefore(currentTime, endTime)) {
      // Verificamos si ya existe un turno a esa hora para no duplicar
      const exists = await prisma.appointment.findFirst({
        where: {
          date: currentTime
        }
      });

      if (!exists) {
        slotsToCreate.push({
          date: currentTime,
          isBooked: false,
        });
      }

      // Avanzamos 30 minutos
      currentTime = addMinutes(currentTime, DURATION_MINUTES);
    }

    // Inserción masiva (Muy eficiente)
    if (slotsToCreate.length > 0) {
      await prisma.appointment.createMany({
        data: slotsToCreate,
      });
    }

    // Importante: Avisamos a Next que los datos cambiaron para refrescar la UI
    revalidatePath('/admin'); 
    return { success: true, count: slotsToCreate.length };

  } catch (error) {
    console.error("Error generando turnos:", error);
    return { success: false, error: "Error al generar turnos" };
  }
}

// --- LÓGICA 2: LEER TURNOS (Para el Cliente y Admin) ---
// Obtiene los turnos de un día específico
export async function getAppointmentsForDay(dateString: string) {
  const searchDate = new Date(dateString);
  
  // Filtramos entre las 00:00 y las 23:59 de ese día
  const start = startOfDay(searchDate);
  const end = endOfDay(searchDate);

  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: start, // Mayor o igual al inicio del día
        lte: end,   // Menor o igual al final del día
      },
    },
    orderBy: {
      date: 'asc', // Ordenados por hora
    },
  });

  return appointments;
}

// --- LÓGICA 3: RESERVAR TURNO (Para el Cliente) ---
export async function bookAppointment(id: string, clientName: string) {
  try {
    await prisma.appointment.update({
      where: { id },
      data: {
        isBooked: true,
        clientName: clientName,
      },
    });
    
    revalidatePath('/'); // Refrescar la home
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo reservar el turno" };
  }
}

// --- LÓGICA 4: CANCELAR TURNO (Para el Admin) ---
export async function cancelAppointment(id: string) {
  try {
    await prisma.appointment.update({
      where: { id },
      data: {
        isBooked: false,
        clientName: null, // Limpiamos el nombre
      },
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error cancelando turno" };
  }
}