'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useState } from 'react';
import { type WaitlistResponse, type WaitlistRow } from '@/lib/waitlist/waitlist-data';
import { PatientDetailModal } from './PatientDetailModal';
import styles from './Waitlist.module.css';

interface WaitlistTableProps {
    data: WaitlistResponse;
}

export function WaitlistTable({ data }: WaitlistTableProps) {
    const [selectedPatient, setSelectedPatient] = useState<WaitlistRow | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to update URL params
    const updateParam = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Reset page to 1 on filter/sort change unless key is 'page'
        if (key !== 'page') {
            params.set('page', '1');
        }
        router.push(`?${params.toString()}`);
    }, [searchParams, router]);

    const handleSort = (key: keyof WaitlistRow) => {
        const currentSort = searchParams.get('sortBy');
        const currentDir = searchParams.get('sortDir') || 'desc';

        let newDir = 'asc';
        if (currentSort === key && currentDir === 'asc') {
            newDir = 'desc';
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('sortBy', key);
        params.set('sortDir', newDir);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const getRowClass = (row: WaitlistRow) => {
        if (row.suspendida) return styles.rowSuspended;
        if (row.priorizable) return styles.rowPriority;
        if (row.rdo_preanestesia.toUpperCase().trim() === 'APTO') return styles.rowApto;
        const ta = row.t_anestesia.toUpperCase();
        if (ta.includes('LOCAL') || ta.includes('SIN ANESTESIA')) return styles.rowLocal;
        return '';
    };

    const isOnco = (d: string) => d.toUpperCase().startsWith('NEOPLASIA MALIGNA');
    const isGarantia = (p: string) => p.toUpperCase().trim() === 'SI';

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('rdq')} style={{ cursor: 'pointer' }}>RDQ</th>
                            <th onClick={() => handleSort('paciente')} style={{ cursor: 'pointer' }}>Paciente / NHC</th>
                            <th onClick={() => handleSort('diagnostico')} style={{ cursor: 'pointer' }}>Diagnóstico</th>
                            <th onClick={() => handleSort('procedimiento')} style={{ cursor: 'pointer' }}>Procedimiento</th>
                            <th onClick={() => handleSort('t_registro')} style={{ cursor: 'pointer' }}>Días</th>
                            <th>Estado</th>
                            <th onClick={() => handleSort('facultativo')} style={{ cursor: 'pointer' }}>Facultativo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((row) => (
                            <tr
                                key={row.rdq}
                                className={getRowClass(row)}
                                onClick={() => setSelectedPatient(row)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{row.rdq}</td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{row.paciente}</div>
                                    <div style={{ fontSize: '0.75em', color: 'var(--color-gray-500)' }}>{row.nhc}</div>
                                </td>
                                <td>{row.diagnostico}</td>
                                <td>{row.procedimiento}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.t_registro}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {row.priorizable && <span className={`${styles.badge} ${styles.badgePriority}`}>Prioridad</span>}
                                        {isGarantia(row.procedimiento_garantia) && <span className={`${styles.badge} ${styles.badgeGarantia}`}>Garantía</span>}
                                        {isOnco(row.diagnostico) && <span className={`${styles.badge} ${styles.badgeOnco}`}>Onco</span>}
                                        {row.suspendida && <span className={styles.badge} style={{ background: '#e5e7eb', color: '#374151' }}>Suspendida</span>}
                                    </div>
                                </td>
                                <td>{row.facultativo}</td>
                            </tr>
                        ))}
                        {data.data.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No se encontraron pacientes con los filtros actuales.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedPatient && (
                <PatientDetailModal
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                />
            )}

            {/* Pagination */}
            <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                    Mostrando <strong>{data.data.length}</strong> de <strong>{data.total}</strong> pacientes
                    (Página {data.page} de {data.totalPages})
                </div>
                <div className={styles.pageButtons}>
                    <button
                        className={styles.pageButton}
                        disabled={data.page <= 1}
                        onClick={() => updateParam('page', String(data.page - 1))}
                    >
                        Anterior
                    </button>
                    <button
                        className={styles.pageButton}
                        disabled={data.page >= data.totalPages}
                        onClick={() => updateParam('page', String(data.page + 1))}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
