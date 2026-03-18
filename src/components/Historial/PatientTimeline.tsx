'use client';

import { ViajeEntry } from '@/app/(protected)/historial/trazabilidad-actions';
import styles from './PatientTimeline.module.css';

interface PatientTimelineProps {
    viaje: ViajeEntry;
    /** Cuando se muestran múltiples episodios, añadir un marcador de RDQ */
    showRdqHeader?: boolean;
}

export default function PatientTimeline({ viaje, showRdqHeader = false }: PatientTimelineProps) {
    const { candidato: p, quirofanos } = viaje;

    // Sort quirofanos chronologically
    const quirofanosSorted = [...quirofanos].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const fRegistroStr = p.created_at
        ? new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'Desconocida';

    const isActivo = p.estado?.toLowerCase() === 'activo';

    return (
        <div className={styles.timelineWrapper}>
            {/* Cabecera del episodio */}
            <div className={styles.patientHeader}>
                <div className={styles.patientTitleRow}>
                    <div className={styles.patientName}>{p.paciente || 'Nombre no disponible'}</div>
                    {showRdqHeader && (
                        <div className={styles.epLabel}>Episodio RDQ {p.rdq}</div>
                    )}
                </div>
                <div className={styles.patientDetails}>
                    <span className={styles.rdqBadge}>RDQ: {p.rdq}</span>
                    {p.nhc && <span className={styles.nhcBadge}>NHC: {p.nhc}</span>}
                    <span className={isActivo ? styles.statusActivo : styles.statusPasivo}>
                        {p.estado || 'Desconocido'}
                    </span>
                </div>
                <div className={styles.diagnostico}>
                    <span><strong>Diagnóstico:</strong> {p.diagnostico}</span>
                    {p.intervencion_propuesta && (
                        <span><strong>Intervención propuesta:</strong> {p.intervencion_propuesta}</span>
                    )}
                </div>
            </div>

            <div className={styles.timeline}>
                {/* Hito: Entrada en lista */}
                <div className={styles.timelineEvent}>
                    <div className={styles.eventMarker}></div>
                    <div className={styles.eventContent}>
                        <div className={styles.eventDate}>{fRegistroStr}</div>
                        <div className={styles.eventTitle}>📋 Registro en Lista de Espera</div>
                        <div className={styles.eventDescription}>
                            Tiempo de espera: <strong>{p.t_registro} días</strong>.
                        </div>
                    </div>
                </div>

                {/* Hitos: Programaciones a Quirófano */}
                {quirofanosSorted.map((q) => {
                    const isCompletado = q.completado;
                    const dateStr = new Date(q.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    });

                    return (
                        <div
                            key={q.id_quirofano}
                            className={`${styles.timelineEvent} ${isCompletado ? styles.eventSuccess : styles.eventFuture}`}
                        >
                            <div className={styles.eventMarker}></div>
                            <div className={styles.eventContent}>
                                <div className={styles.eventDate}>{dateStr}</div>
                                <div className={styles.eventTitle}>
                                    🏥 Sesión Quirúrgica{' '}
                                    <span className={isCompletado ? styles.tagCompletado : styles.tagPendiente}>
                                        {isCompletado ? 'Completada' : 'Programada / Pendiente'}
                                    </span>
                                </div>
                                <div className={styles.eventDescription}>
                                    <strong>Tipo:</strong> {q.tipo_quirofano?.toUpperCase() || 'Sin especificar'}<br />
                                    <strong>Equipo médico:</strong> {q.equipo_medico || 'No especificado'}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Sin programaciones */}
                {quirofanosSorted.length === 0 && (
                    <div className={`${styles.timelineEvent} ${styles.eventEmpty}`}>
                        <div className={styles.eventMarker}></div>
                        <div className={styles.eventContent}>
                            <div className={styles.eventTitle}>⏳ Sin programaciones registradas</div>
                            <div className={styles.eventDescription}>
                                Esta paciente aún no ha sido asignada a ningún parte de quirófano.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.futureEndpoint}>
                — {isActivo ? 'En lista de espera' : 'Estado: ' + (p.estado || 'No especificado')} —
            </div>
        </div>
    );
}
