'use server';

import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/roles';
import { getCurrentUserRole } from '@/lib/auth/session';
import { usersService } from '@/services/usersService';
import type { AppRole } from '@/lib/auth/roles';

async function requireAdmin() {
    const rol = await getCurrentUserRole();
    if (!isAdmin(rol)) redirect('/dashboard');
}

export async function inviteUserAction(formData: FormData): Promise<{ error?: string }> {
    await requireAdmin();
    const email = formData.get('email') as string;
    const nombre = formData.get('nombre') as string;
    const rol = formData.get('rol') as AppRole;

    try {
        await usersService.inviteUser(email, nombre, rol);
        return {};
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Error invitando al usuario.' };
    }
}

export async function updateUserAction(formData: FormData): Promise<{ error?: string }> {
    await requireAdmin();
    const id = formData.get('id') as string;
    const rol = formData.get('rol') as AppRole;
    const activo = formData.get('activo') === 'true';
    const nombre = formData.get('nombre') as string | null;

    try {
        const updates: { rol?: AppRole; activo?: boolean; nombre?: string } = { rol, activo };
        if (nombre !== null) updates.nombre = nombre;
        await usersService.updateUser(id, updates);
        return {};
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Error actualizando el usuario.' };
    }
}

export async function resetPasswordAction(formData: FormData): Promise<{ error?: string }> {
    await requireAdmin();
    const id = formData.get('id') as string;
    const password = formData.get('password') as string;

    try {
        await usersService.updateUserPassword(id, password);
        return {};
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Error reseteando la contraseña.' };
    }
}
