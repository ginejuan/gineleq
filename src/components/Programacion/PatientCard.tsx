'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './Programacion.module.css';
import { PacienteSugerido } from '@/services/programacionService';

interface PatientCardProps {
    paciente: PacienteSugerido;
}

export default function PatientCard({ paciente }: PatientCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `paciente-${paciente.rdq}`,
        data: { paciente } // Guardar data extra para recuperar al soltar
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={styles.patientCard}
            {...attributes}
            {...listeners}
        >
            <div className={styles.cardHeader}>
                <span className={styles.rdqLabel}>RDQ: {paciente.rdq}</span>
                <span className={styles.scoreBadge} title="Puntos de Escala Médica">
                    {paciente.scoreDetails.puntosTotales} pts
                </span>
            </div>

            <div className={styles.cardBody}>
                {paciente.scoreDetails.puntosPriorizable > 0 && <span className={styles.tagPriorizable}>Priorizado</span>}
                {paciente.prioridad?.trim().toUpperCase() === 'PREFERENTE' && <span className={styles.tagPreferente}>Preferente</span>}
                {paciente.scoreDetails.puntosOncologico > 0 && <span className={styles.tagOncologico} style={{ marginLeft: paciente.scoreDetails.puntosPriorizable > 0 || paciente.prioridad?.trim().toUpperCase() === 'PREFERENTE' ? '4px' : '0' }}>Oncológico</span>}

                <div style={{ fontSize: '0.9em', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                    👤 {paciente.paciente}
                </div>
                <strong style={{ fontSize: '0.85em', display: 'block', marginBottom: '2px', lineHeight: '1.2' }}>
                    {paciente.procedimiento || paciente.intervencion_propuesta}
                </strong>
                <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', lineHeight: '1.2' }}>
                    {paciente.diagnostico}
                </span>

                {(paciente.observaciones || paciente.comentarios) && (
                    <div style={{ fontSize: '0.75em', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {paciente.observaciones && (
                            <div><strong style={{ color: 'var(--text-color)' }}>Obs:</strong> <span style={{ color: 'var(--text-secondary)' }}>{paciente.observaciones}</span></div>
                        )}
                        {paciente.comentarios && (
                            <div><strong style={{ color: 'var(--text-color)' }}>Médico:</strong> <span style={{ color: 'var(--text-secondary)' }}>{paciente.comentarios}</span></div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.cardFooter}>
                <span>
                    {paciente.estado}
                    {paciente.rdo_preanestesia?.toLowerCase() !== 'apto' && (
                        <span style={{ color: 'var(--color-danger)', marginLeft: '6px', fontWeight: 600 }}>
                            Sin Vº Bº anestesia
                        </span>
                    )}
                </span>
                <span title={paciente.procedimiento_garantia?.toUpperCase() === 'SI' ? 'Días basados en Tiempo de Garantía' : 'Días basados en Tiempo de Registro'}>
                    {paciente.scoreDetails.puntosAntiguedad} Días
                </span>
            </div>
        </div>
    );
}
