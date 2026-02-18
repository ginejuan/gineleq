/**
 * Next.js Middleware — Protección de rutas
 * 
 * Intercepta todas las peticiones y:
 * - Si NO hay sesión → redirige a /login
 * - Si HAY sesión y está en ruta pública → redirige a /dashboard
 * - Refresca tokens de sesión automáticamente
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware-client';

const PUBLIC_ROUTES = [
    '/login',
    '/registro',
    '/recuperar',
    '/auth/auth-code-error',
    '/auth/callback',
    '/reset-password'
];

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    );
}

function isStaticAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // favicon.ico, images, etc.
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // No interceptar assets estáticos
    if (isStaticAsset(pathname)) {
        return NextResponse.next();
    }

    const { user, supabaseResponse } = await updateSession(request);

    // Usuario NO autenticado en ruta protegida → login
    if (!user && !isPublicRoute(pathname)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        // Preserve query params for debugging/redirection context
        return NextResponse.redirect(loginUrl);
    }

    // Usuario autenticado en ruta pública → dashboard
    if (user && isPublicRoute(pathname)) {
        // Excepcion: Permitir acceso a rutas de auth/reset incluso si hay sesión
        // (por ejemplo, para cambiar contraseña o verificar email)
        const isAuthFlow =
            pathname.startsWith('/auth/') ||
            pathname === '/reset-password' ||
            pathname === '/recuperar';

        if (!isAuthFlow) {
            const dashboardUrl = request.nextUrl.clone();
            dashboardUrl.pathname = '/dashboard';
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto:
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
