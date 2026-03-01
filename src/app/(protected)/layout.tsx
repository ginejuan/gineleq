/**
 * Layout para rutas protegidas
 *
 * Server Component: lee el rol del usuario autenticado y lo pasa
 * al Sidebar para mostrar/ocultar items según permisos.
 */

import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import UserHeader from '@/components/UserHeader/UserHeader';
import { getCurrentUserRole } from '@/lib/auth/session';
import { isAdmin, ADMIN_ONLY_ROUTES } from '@/lib/auth/roles';
import { headers } from 'next/headers';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const rol = await getCurrentUserRole();

    // Protección de rutas admin-only en el servidor (fuente de verdad)
    const headersList = await headers();
    const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '';
    const isAdminOnly = ADMIN_ONLY_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    );
    if (isAdminOnly && !isAdmin(rol)) {
        redirect('/dashboard');
    }

    return (
        <div className="app-layout">
            <Sidebar rol={rol} />
            <div className="app-content">
                <UserHeader />
                <main className="app-main">
                    {children}
                </main>
            </div>
        </div>
    );
}

