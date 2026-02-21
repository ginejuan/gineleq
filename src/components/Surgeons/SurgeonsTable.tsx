'use client';

import React from 'react';
import { Cirujano } from '@/types/database';
import styles from './Surgeons.module.css';

interface SurgeonsTableProps {
    cirujanos: Cirujano[];
    isLoading: boolean;
    onEdit: (cirujano: Cirujano) => void;
    onDelete: (id: string, nombreCompleto: string) => void;
}

export function SurgeonsTable({ cirujanos, isLoading, onEdit, onDelete }: SurgeonsTableProps) {
    if (isLoading) {
        return (
            <div className={styles.tableCard} style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <p className={styles.textMuted}>Cargando facultativos...</p>
            </div>
        );
    }

    if (cirujanos.length === 0) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>👨‍⚕️</div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-primary)' }}>No hay cirujanos registrados</h3>
                    <p>Comienza añadiendo el primer facultativo a la base de datos.</p>
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
                            <th>Nombre Completo</th>
                            <th>Contacto</th>
                            <th>Subespecialidades</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cirujanos.map((cirujano) => {
                            const fullName = `${cirujano.nombre} ${cirujano.apellido1} ${cirujano.apellido2 || ''}`.trim();

                            return (
                                <tr key={cirujano.id_cirujano}>
                                    <td style={{ fontWeight: 500 }}>{fullName}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {cirujano.e_mail && <span style={{ fontSize: 'var(--font-size-xs)' }}>✉️ {cirujano.e_mail}</span>}
                                            {cirujano.telefono_movil && <span style={{ fontSize: 'var(--font-size-xs)' }}>📞 {cirujano.telefono_movil}</span>}
                                            {!cirujano.e_mail && !cirujano.telefono_movil && <span className={styles.textMuted} style={{ fontSize: 'var(--font-size-xs)' }}>Sin datos</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.badgeMulti}>
                                            {cirujano.onco_gine && <span className={`${styles.badge} ${styles.badgePurple}`}>Onco. Gine.</span>}
                                            {cirujano.onco_mama && <span className={`${styles.badge} ${styles.badgePink}`}>Onco. Mama</span>}
                                            {!cirujano.onco_gine && !cirujano.onco_mama && <span className={styles.textMuted} style={{ fontSize: 'var(--font-size-xs)' }}>General</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actionsCell}>
                                            <button
                                                className={styles.btnIcon}
                                                onClick={() => onEdit(cirujano)}
                                                title="Editar facultativo"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                                                onClick={() => onDelete(cirujano.id_cirujano, fullName)}
                                                title="Eliminar facultativo"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
