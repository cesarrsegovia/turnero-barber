'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  // 1. Extraer datos del formulario
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // 2. Buscar al admin en la base de datos
  const admin = await prisma.admin.findUnique({
    where: { username }
  });

  // 3. Verificar contraseña (simple string comparison por ahora)
  if (admin && admin.password === password) {
    
    // 4. Crear la sesión (Cookie segura)
    // Nota: En Next.js 15, cookies() es asíncrono
    const cookieStore = await cookies();
    
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true, // JavaScript no puede leerla (seguridad XSS)
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      maxAge: 60 * 60 * 24, // Expira en 24 horas
      path: '/',
    });

    // 5. Redirigir al dashboard
    redirect('/admin');
  } else {
    return { message: 'Credenciales inválidas. Intenta de nuevo.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}