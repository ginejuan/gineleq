/**
 * usersService.ts — CRUD de usuarios para el panel de administración
 *
 * Solo invocable por admins (RLS + comprobación de rol en server actions).
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppRole } from '@/lib/auth/roles';

export interface UserProfile {
    id: string;
    nombre: string | null;
    rol: AppRole;
    activo: boolean;
    created_at: string;
    email?: string;
}

export const usersService = {
    /** Lista todos los perfiles (solo admin) */
    getAllUsers: async (): Promise<UserProfile[]> => {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []) as UserProfile[];
    },

    /** Actualiza rol y estado activo de un usuario */
    updateUser: async (id: string, updates: { rol?: AppRole; activo?: boolean; nombre?: string }): Promise<void> => {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    /** Invita a un nuevo usuario por email (crea cuenta en Supabase Auth) */
    inviteUser: async (email: string, nombre: string, rol: AppRole): Promise<void> => {
        const supabase = createSupabaseAdminClient();

        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { nombre }
        });

        if (error) throw error;

        // Actualizar perfil con nombre y rol (el trigger ya lo habrá creado)
        if (data.user) {
            await usersService.updateUser(data.user.id, { nombre, rol });
        }
    },

    /** Desactiva un usuario (no lo borra) */
    deactivateUser: async (id: string): Promise<void> => {
        await usersService.updateUser(id, { activo: false });
    },
};
