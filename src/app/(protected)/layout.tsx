/**
 * Layout para rutas protegidas
 * 
 * Incluye el Sidebar de navegación.
 * Solo se renderiza cuando el usuario está autenticado
 * (el middleware redirige a /login si no hay sesión).
 */

import Sidebar from '@/components/Sidebar/Sidebar';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                {children}
            </main>
        </div>
    );
}
