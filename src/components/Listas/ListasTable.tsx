'use client';

import React from 'react';
import { ListaDistribucion } from '@/types/database';
import styles from './Listas.module.css';

interface ListasTableProps {
    listas: ListaDistribucion[];
    isLoading: boolean;
    onEdit: (lista: ListaDistribucion) => void;
    onDelete: (id: string, nombre: string) => void;
}

export function ListasTable({ listas, isLoading, onEdit, onDelete }: ListasTableProps) {
    if (isLoading) {
        return (
            <div className={styles.tableCard} style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <p className={styles.subtitle}>Cargando listas de distribución...</p>
            </div>
        );
    }

    if (listas.length === 0) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📬</div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-primary)' }}>No hay listas creadas</h3>
                    <p>Comienza creando tu primera lista de correos electrónicos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre de la Lista</th>
                            <th>Descripción</th>
                            <th>Configuración</th>
                            <th>Destinatarios</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listas.map((lista) => (
                            <tr key={lista.id}>
                                <td style={{ fontWeight: 500 }}>{lista.nombre}</td>
                                <td style={{ color: 'var(--color-text-secondary)' }}>
                                    {lista.descripcion || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sin descripción</span>}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: lista.tipo_destinatario === 'Principal' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                                            {lista.tipo_destinatario === 'Principal' ? '👤 Destinatario Principal' : '👥 En Copia (CC)'}
                                        </span>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: lista.envio_automatico ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                            {lista.envio_automatico ? '⚡ Automático siempre' : '✋ Opcional manual'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.badgesContainer}>
                                        {lista.correos && lista.correos.length > 0 ? (
                                            lista.correos.map((correo, index) => (
                                                <span key={index} className={styles.emailBadge}>
                                                    {correo}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Ninguno</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actionsCell}>
                                        <button
                                            className={styles.btnIcon}
                                            onClick={() => onEdit(lista)}
                                            title="Editar lista"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                                            onClick={() => onDelete(lista.id, lista.nombre)}
                                            title="Eliminar lista"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
