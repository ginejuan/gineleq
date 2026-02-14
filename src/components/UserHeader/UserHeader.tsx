/**
 * UserHeader — Barra superior con info del usuario
 * 
 * Muestra el nombre del usuario autenticado en la esquina
 * superior derecha de todas las páginas protegidas.
 * 
 * Server Component: lee la sesión directamente en el servidor.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './UserHeader.module.css';

interface UserMetadata {
    first_name?: string;
    last_name?: string;
}

export default async function UserHeader() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const metadata = user.user_metadata as UserMetadata;
    const firstName = metadata?.first_name ?? '';
    const lastName = metadata?.last_name ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email;
    const initials = getInitials(firstName, lastName, user.email);

    return (
        <header className={styles.userHeader}>
            <div className={styles.userInfo}>
                <span className={styles.avatar}>{initials}</span>
                <span className={styles.name}>{displayName}</span>
            </div>
        </header>
    );
}

/** Genera iniciales a partir del nombre, o del email si no hay nombre */
function getInitials(
    firstName: string,
    lastName: string,
    email: string | undefined
): string {
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
        return firstName[0].toUpperCase();
    }
    return email?.[0]?.toUpperCase() ?? '?';
}
