/**
 * Layout para rutas protegidas
 * 
 * Incluye el Sidebar de navegación y el UserHeader con
 * el nombre del usuario autenticado en la esquina superior derecha.
 * Solo se renderiza cuando el usuario está autenticado
 * (el middleware redirige a /login si no hay sesión).
 */

import Sidebar from '@/components/Sidebar/Sidebar';
import UserHeader from '@/components/UserHeader/UserHeader';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-content">
                <UserHeader />
                <main className="app-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
