'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QuirofanoConCirujanos } from '@/types/database';
import { PacienteSugerido } from '@/services/programacionService';
import PatientCard from './PatientCard';
import styles from './Programacion.module.css';

interface QuirofanoDropzoneProps {
    quirofano: QuirofanoConCirujanos;
    pacientesAsignados: PacienteSugerido[];
    onToggleCompletado?: (id: string, completado: boolean) => void;
}

export default function QuirofanoDropzone({ quirofano, pacientesAsignados, onToggleCompletado }: QuirofanoDropzoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `quirofano-${quirofano.id_quirofano}`,
        data: {
            tipo_quirofano: quirofano.tipo_quirofano // útil para validación (ej. impedir "Local" en "Central")
        }
    });

    const isCompletado = quirofano.completado === true;
    const dropzoneClass = `${styles.quirofanoDropzone} ${isOver ? styles.isOver : ''} ${isCompletado ? styles.completado : ''}`;

    // Extraer y formatear la fecha
    const fechaObj = new Date(quirofano.fecha);
    const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

    // Extraer los IDs para el SortableContext
    const itemsIds = pacientesAsignados.map(p => `paciente-${p.rdq}`);

    return (
        <div ref={setNodeRef} className={dropzoneClass}>
            <div className={styles.dropzoneHeader}>
                <div className={styles.dropzoneHeaderTitles}>
                    <span className={styles.dropzoneTitle}>{fechaStr} - {quirofano.turno}</span>
                    <span className={styles.dropzoneSubtitle}>
                        {quirofano.tipo_quirofano || 'Sin especificar'}
                        {quirofano.quirofano_cirujano && quirofano.quirofano_cirujano.length > 0 && (
                            <span style={{ display: 'block', marginTop: '4px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                👨‍⚕️ {quirofano.quirofano_cirujano.map(qc =>
                                    `${qc.cirujanos.apellido1} ${qc.cirujanos.apellido2 || ''}, ${qc.cirujanos.nombre}`.trim()
                                ).join(' • ')}
                            </span>
                        )}
                    </span>
                </div>
                <div className={styles.dropzoneHeaderControls}>
                    <a
                        href={`/programacion/parte/${quirofano.id_quirofano}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.printButton}
                        title="Imprimir Parte de Quirófano"
                    >
                        🖨️
                    </a>
                    {onToggleCompletado && (
                        <label className={styles.toggleCompletadoLabel} title="Marcar Quirófano como cerrado/completado">
                            <input
                                type="checkbox"
                                checked={isCompletado}
                                onChange={(e) => onToggleCompletado(quirofano.id_quirofano, e.target.checked)}
                                className={styles.toggleCompletadoCheckbox}
                            />
                            Completado
                        </label>
                    )}
                </div>
            </div>

            <SortableContext items={itemsIds} strategy={verticalListSortingStrategy}>
                <div className={styles.dropArea}>
                    {pacientesAsignados.length === 0 ? (
                        <div className={styles.emptyDrop}>
                            Arrastra pacientes aqu&iacute;
                            <br /><small>(Q. Central &rarr; Grupo A)</small>
                        </div>
                    ) : (
                        pacientesAsignados.map(p => (
                            <PatientCard key={p.rdq} paciente={p} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
