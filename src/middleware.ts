import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Intentamos leer la cookie de sesión
  const authCookie = request.cookies.get('admin_session');

  // 2. Verificamos si estamos intentando entrar a una ruta protegida
  // En este caso, todo lo que empiece por /admin
  if (!authCookie) {
    // Si no hay cookie, redirigimos al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Si hay cookie, dejamos pasar
  return NextResponse.next();
}

// Configuración: Aquí definimos qué rutas protege este middleware
export const config = {
  matcher: '/admin/:path*', // Aplica a /admin y cualquier subruta /admin/lo-que-sea
};