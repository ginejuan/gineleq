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
                {paciente.scoreDetails.puntosOncologico > 0 && <span className={styles.tagOncologico}>Oncológico</span>}

                <div style={{ fontSize: '0.9em', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                    👤 {paciente.paciente}
                </div>
                <strong style={{ fontSize: '0.85em' }}>{paciente.diagnostico}</strong>
                <p style={{ fontSize: '0.85em' }}>{paciente.intervencion_propuesta}</p>
            </div>

            <div className={styles.cardFooter}>
                <span>{paciente.estado}</span>
                <span title={paciente.procedimiento_garantia?.toUpperCase() === 'SI' ? 'Días basados en Tiempo de Garantía' : 'Días basados en Tiempo de Registro'}>
                    {paciente.scoreDetails.puntosAntiguedad} Días
                </span>
            </div>
        </div>
    );
}
