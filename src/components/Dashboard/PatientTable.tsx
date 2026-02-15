/**
 * PatientTable — Listado de Seguimiento Crítico
 *
 * Tabla con filas coloreadas según prioridad clínica.
 * Orden de prioridad de color:
 * 1. Gris (#F1F5F9) → suspendida
 * 2. Violeta (#F5F3FF) → priorizable
 * 3. Verde (#ECFDF5) → rdo_preanestesia == "Apto"
 * 4. Azul (#E0F2FE) → T. Anestesia "Local" / "Sin anestesia"
 *
 * Principio SoC: no queries, solo renderiza datos recibidos.
 */

import styles from './Dashboard.module.css';
import type { PatientRow } from '@/lib/dashboard/dashboard-data';

interface PatientTableProps {
    patients: PatientRow[];
}

function getRowStyle(p: PatientRow): string {
    if (p.suspendida) return styles.rowSuspended;
    if (p.priorizable) return styles.rowPriority;
    if (p.rdo_preanestesia.toUpperCase().trim() === 'APTO') return styles.rowApto;
    const ta = p.t_anestesia.toUpperCase();
    if (ta.includes('LOCAL') || ta.includes('SIN ANESTESIA')) return styles.rowLocal;
    return '';
}

export function PatientTable({ patients }: PatientTableProps) {
    return (
        <div className={styles.tableWrapper}>
            <h3 className={styles.chartTitle}>Seguimiento Crítico</h3>
            <div className={styles.tableLegend}>
                <span className={`${styles.legendDot} ${styles.rowSuspended}`} /> Suspendida
                <span className={`${styles.legendDot} ${styles.rowPriority}`} /> Priorizable
                <span className={`${styles.legendDot} ${styles.rowApto}`} /> Apto
                <span className={`${styles.legendDot} ${styles.rowLocal}`} /> Local/Sin
            </div>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>RDQ</th>
                            <th>Paciente</th>
                            <th>NHC</th>
                            <th>Diagnóstico</th>
                            <th>Procedimiento</th>
                            <th>Días</th>
                            <th>Prioridad</th>
                            <th>Anestesia</th>
                            <th>Preanest.</th>
                            <th>Facultativo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(p => (
                            <tr key={p.rdq} className={getRowStyle(p)}>
                                <td>{p.rdq}</td>
                                <td className={p.suspendida ? styles.textMuted : ''}>
                                    {p.paciente}
                                </td>
                                <td>{p.nhc}</td>
                                <td className={styles.cellDiag}>{p.diagnostico}</td>
                                <td className={styles.cellDiag}>{p.procedimiento}</td>
                                <td className={styles.cellCenter}>{p.t_registro}</td>
                                <td>{p.prioridad}</td>
                                <td>{p.t_anestesia}</td>
                                <td>{p.rdo_preanestesia}</td>
                                <td>{p.facultativo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
