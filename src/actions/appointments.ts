'use server'; // 👈 Esto marca que todo este archivo se ejecuta en el servidor

import prisma from '@/lib/prisma';
import { addMinutes, setHours, setMinutes, startOfDay, endOfDay, isBefore } from 'date-fns';
import { revalidatePath } from 'next/cache';

// 1. Función auxiliar para obtener la config (Privada, no se exporta)
async function getBusinessConfig() {
  const config = await prisma.businessConfig.findFirst();
  // Si por alguna razón no hay config, devolvemos un fallback seguro
  return config || { startHour: 9, endHour: 18, interval: 30 };
}

// --- LÓGICA 1: GENERAR TURNOS (Para el Admin) ---
// Esta función crea "huecos" vacíos para un día específico.
// Ej: Generar slots para el "2025-12-01" cada 30 mins de 9am a 6pm.
export async function generateDaySlots(dateString: string) {
  try {
    const baseDate = new Date(dateString);
    
    // 👇 AQUÍ ESTÁ EL CAMBIO: Leemos de la DB
    const { startHour, endHour, interval } = await getBusinessConfig();

    // Usamos las variables dinámicas
    let currentTime = setMinutes(setHours(baseDate, startHour), 0);
    const endTime = setMinutes(setHours(baseDate, endHour), 0);

    const slotsToCreate = [];

    while (isBefore(currentTime, endTime)) {
      const exists = await prisma.appointment.findFirst({
        where: { date: currentTime }
      });

      if (!exists) {
        slotsToCreate.push({
          date: currentTime,
          isBooked: false,
        });
      }

      // 👇 Usamos el intervalo dinámico
      currentTime = addMinutes(currentTime, interval);
    }

    if (slotsToCreate.length > 0) {
      await prisma.appointment.createMany({
        data: slotsToCreate,
      });
    }

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

// 3. NUEVA ACCIÓN: Para actualizar la configuración desde el Admin
export async function updateConfig(formData: FormData) {
  const startHour = parseInt(formData.get('startHour') as string);
  const endHour = parseInt(formData.get('endHour') as string);
  const interval = parseInt(formData.get('interval') as string);

  // Validaciones básicas
  if (startHour >= endHour) return { success: false, error: "La apertura debe ser antes del cierre" };

  // Actualizamos el primer registro que encontremos (Singleton pattern para config)
  const config = await prisma.businessConfig.findFirst();
  
  if (config) {
    await prisma.businessConfig.update({
      where: { id: config.id },
      data: { startHour, endHour, interval }
    });
  } else {
    // Fallback por si acaso
    await prisma.businessConfig.create({
      data: { startHour, endHour, interval }
    });
  }
  
  revalidatePath('/admin');
  return { success: true };
}

// 4. NUEVA ACCIÓN: Para leer la configuración actual en el frontend
export async function getConfig() {
  return await getBusinessConfig();
}


// 5. NUEVA ACCIÓN: Buscar turnos futuros o por nombre
export async function searchAppointments(query: string = '') {
  try {
    const now = new Date();
    
    // Configuración de la consulta
    const appointments = await prisma.appointment.findMany({
      where: {
        isBooked: true, // Solo nos interesan los reservados
        date: {
          gte: now, // Solo turnos futuros (gte = Greater Than or Equal)
        },
        // Si hay texto de búsqueda, filtramos por nombre
        ...(query ? {
          clientName: {
            contains: query, // Búsqueda parcial (ej: "Car" encuentra "Carlos")
            // mode: 'insensitive' // (Opcional: SQLite no soporta esto nativamente bien, pero en Postgres sí)
          }
        } : {})
      },
      orderBy: {
        date: 'asc', // Los más próximos primero
      },
      take: 10, // Limitamos a 10 para no saturar la vista
    });

    return { success: true, data: appointments };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al buscar turnos" };
  }
}