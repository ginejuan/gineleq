/**
 * Admin — Gestión de Usuarios
 *
 * Solo accesible para administradores.
 * El layout ya garantiza la redirección si el usuario no es admin.
 */

import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/roles';
import { usersService } from '@/services/usersService';
import UsersTable from '@/components/Admin/UsersTable';

export default async function AdminUsuariosPage() {
    const rol = await getCurrentUserRole();
    if (!isAdmin(rol)) redirect('/dashboard');

    const usuarios = await usersService.getAllUsers();

    return (
        <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Gestión de Usuarios
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    Administra los accesos y roles de los usuarios de GineLeq.
                </p>
            </div>
            <UsersTable usuarios={usuarios} />
        </div>
    );
}
