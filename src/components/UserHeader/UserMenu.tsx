'use client';

/**
 * UserMenu — Menú desplegable del usuario
 *
 * Componente cliente que muestra un dropdown al hacer clic
 * sobre el avatar/nombre del usuario con acciones de perfil.
 */

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './UserHeader.module.css';

interface UserMenuProps {
    displayName: string;
    email: string;
    initials: string;
}

export default function UserMenu({ displayName, email, initials }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setMessage(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResetPassword = async () => {
        setSending(true);
        setMessage(null);
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setMessage({ text: '✅ Email de restablecimiento enviado.', ok: true });
        } catch {
            setMessage({ text: '❌ Error al enviar el email.', ok: false });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.userMenuWrapper} ref={menuRef}>
            <button
                className={styles.userInfo}
                onClick={() => { setOpen(v => !v); setMessage(null); }}
                aria-expanded={open}
                title="Opciones de cuenta"
            >
                <span className={styles.avatar}>{initials}</span>
                <span className={styles.name}>{displayName}</span>
                <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <span className={styles.dropdownEmail}>{email}</span>
                    </div>
                    <button
                        className={styles.dropdownItem}
                        onClick={handleResetPassword}
                        disabled={sending}
                    >
                        🔑 {sending ? 'Enviando...' : 'Cambiar contraseña'}
                    </button>
                    {message && (
                        <div className={styles.dropdownMessage} style={{ color: message.ok ? '#059669' : '#DC2626' }}>
                            {message.text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
