'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './HistorialClient.module.css';
import TrazabilidadView from './TrazabilidadView';

interface HistorialClientProps {
    quirofanos: any[];
}

export default function HistorialClient({ quirofanos }: HistorialClientProps) {
    const [activeTab, setActiveTab] = useState<'sesiones' | 'viaje'>('sesiones');

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsHeader}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'sesiones' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sesiones')}
                >
                    🏥 Sesiones Quirúrgicas
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'viaje' ? styles.active : ''}`}
                    onClick={() => setActiveTab('viaje')}
                >
                    👤 Viaje de la Paciente
                </button>
            </div>

            {activeTab === 'sesiones' && (
                <>
                    {(!quirofanos || quirofanos.length === 0) ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📜</div>
                            <h3>No hay historial disponible</h3>
                            <p>Aún no existen intervenciones pasadas o marcadas como completadas.</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>FECHA</th>
                                        <th>TIPO QUIRÓFANO</th>
                                        <th>EQUIPO MÉDICO</th>
                                        <th>ESTADO</th>
                                        <th>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quirofanos.map((q) => {
                                        const fechaObj = new Date(q.fecha);
                                        const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
                                        const fechaStr = fechaObj.toLocaleDateString('es-ES', opcionesFecha).toUpperCase();

                                        const cirujanos = q.quirofano_cirujano?.map((qc: any) => {
                                            const c = qc.cirujanos;
                                            if (!c) return '';
                                            const tratamiento = c.tratamiento || 'Dr.';
                                            return `${tratamiento} ${c.nombre} ${c.apellido1}`;
                                        }).filter(Boolean);

                                        const isCompletado = q.completado || false;

                                        return (
                                            <tr key={q.id_quirofano}>
                                                <td className={styles.dateCell}>{fechaStr}</td>
                                                <td>{q.tipo_quirofano?.toUpperCase() || 'QUIRÓFANO'}</td>
                                                <td className={styles.surgeonsCell}>
                                                    {cirujanos && cirujanos.length > 0 ? (
                                                        <ul className={styles.surgeonList}>
                                                            {cirujanos.map((cirujano: string, i: number) => (
                                                                <li key={i}>{cirujano}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className={styles.noSurgeons}>Sin asignar</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {isCompletado ? (
                                                        <span className={styles.badgeCompleted}>Completado</span>
                                                    ) : (
                                                        <span className={styles.badgePast}>Sesión Pasada</span>
                                                    )}
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    {q.quirofanos_documentos && q.quirofanos_documentos.length > 0 ? (
                                                        <div className={styles.versionsContainer}>
                                                            <span className={styles.versionsLabel}>Versiones enviadas:</span>
                                                            {q.quirofanos_documentos
                                                                .sort((a: any, b: any) => b.version - a.version)
                                                                .map((doc: any) => (
                                                                <a key={doc.id} href={doc.pdf_url} target="_blank" rel="noreferrer" className={styles.versionLink}>
                                                                    📄 PDF v{doc.version}
                                                                </a>
                                                            ))}
                                                            <Link href={`/programacion/parte/${q.id_quirofano}`} className={styles.viewButton} style={{marginTop: '4px'}}>
                                                                + Generar Nuevo
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <Link href={`/programacion/parte/${q.id_quirofano}`} className={styles.viewButton}>
                                                            📄 Generar Parte
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'viaje' && (
                <TrazabilidadView />
            )}
        </div>
    );
}
