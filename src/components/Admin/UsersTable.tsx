'use client';

/**
 * UsersTable — Tabla de Admin para gestión de usuarios
 *
 * Permite ver, cambiar rol, activar/desactivar e invitar nuevos usuarios.
 */

import { useState } from 'react';
import type { UserProfile } from '@/services/usersService';
import type { AppRole } from '@/lib/auth/roles';
import { inviteUserAction, updateUserAction } from '@/app/(protected)/admin/usuarios/actions';

interface UsersTableProps {
    usuarios: UserProfile[];
}

const ROL_LABELS: Record<AppRole, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    consulta: 'Consulta',
};

export default function UsersTable({ usuarios: initialUsuarios }: UsersTableProps) {
    const [usuarios, setUsuarios] = useState(initialUsuarios);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteNombre, setInviteNombre] = useState('');
    const [inviteRol, setInviteRol] = useState<AppRole>('gestor');
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    const handleRolChange = async (id: string, nuevoRol: AppRole) => {
        setSaving(id);
        const fd = new FormData();
        fd.append('id', id);
        fd.append('rol', nuevoRol);
        const usuario = usuarios.find(u => u.id === id);
        fd.append('activo', String(usuario?.activo ?? true));
        await updateUserAction(fd);
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
        setSaving(null);
    };

    const handleToggleActivo = async (id: string, activo: boolean) => {
        setSaving(id);
        const fd = new FormData();
        fd.append('id', id);
        const usuario = usuarios.find(u => u.id === id);
        fd.append('rol', usuario?.rol ?? 'consulta');
        fd.append('activo', String(activo));
        await updateUserAction(fd);
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo } : u));
        setSaving(null);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setInviteError(null);
        setInviteSuccess(false);
        const fd = new FormData();
        fd.append('email', inviteEmail);
        fd.append('nombre', inviteNombre);
        fd.append('rol', inviteRol);
        const result = await inviteUserAction(fd);
        if (result.error) {
            setInviteError(result.error);
        } else {
            setInviteSuccess(true);
            setInviteEmail('');
            setInviteNombre('');
        }
        setInviting(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>

            {/* Tabla de usuarios */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg)' }}>
                            {['Nombre / Email', 'Rol', 'Estado', 'Alta', 'Acciones'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: u.activo ? 1 : 0.5 }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: 600 }}>{u.nombre || '—'}</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8em' }}>{u.id}</div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <select
                                        value={u.rol}
                                        disabled={saving === u.id}
                                        onChange={e => handleRolChange(u.id, e.target.value as AppRole)}
                                        style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-surface)' }}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="gestor">Gestor</option>
                                        <option value="consulta">Consulta</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8em',
                                        backgroundColor: u.activo ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: u.activo ? '#059669' : '#DC2626'
                                    }}>
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                                    {new Date(u.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <button
                                        disabled={saving === u.id}
                                        onClick={() => handleToggleActivo(u.id, !u.activo)}
                                        style={{
                                            padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                                            cursor: 'pointer', fontSize: 'var(--font-size-sm)', background: 'var(--color-surface)',
                                            color: u.activo ? 'var(--color-danger)' : 'var(--color-primary)'
                                        }}
                                    >
                                        {u.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Formulario de invitación */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--spacing-xl)' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    ✉️ Invitar nuevo usuario
                </h2>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
                        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Nombre</label>
                        <input
                            type="text"
                            value={inviteNombre}
                            onChange={e => setInviteNombre(e.target.value)}
                            required
                            placeholder="Juan García"
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 220px' }}>
                        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                            placeholder="usuario@example.com"
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Rol</label>
                        <select
                            value={inviteRol}
                            onChange={e => setInviteRol(e.target.value as AppRole)}
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-surface)' }}
                        >
                            <option value="gestor">Gestor</option>
                            <option value="consulta">Consulta</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={inviting}
                        style={{
                            padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                            background: 'var(--color-primary)', color: 'white', fontWeight: 600,
                            cursor: 'pointer', fontSize: 'var(--font-size-sm)'
                        }}
                    >
                        {inviting ? 'Enviando...' : 'Enviar invitación'}
                    </button>
                </form>
                {inviteError && <p style={{ color: 'var(--color-danger)', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>{inviteError}</p>}
                {inviteSuccess && <p style={{ color: '#059669', marginTop: '8px', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>✓ Invitación enviada correctamente.</p>}
            </div>
        </div>
    );
}
