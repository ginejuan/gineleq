'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { fetchSugerenciasAccion, asignarPacienteAccion, desasignarPacienteAccion, actualizarOrdenPacientesAccion } from '@/app/(protected)/programacion/actions';
import { agendaService } from '@/services/agendaService';
import { QuirofanoConCirujanos } from '@/types/database';
import { PacienteSugerido } from '@/services/programacionService';
import PatientCard from './PatientCard';
import QuirofanoDropzone from './QuirofanoDropzone';
import styles from './Programacion.module.css';

export default function ProgramacionBoard() {
    const [grupoA, setGrupoA] = useState<PacienteSugerido[]>([]);
    const [grupoB, setGrupoB] = useState<PacienteSugerido[]>([]);
    const [quirofanosSemana, setQuirofanosSemana] = useState<QuirofanoConCirujanos[]>([]);
    const [asignaciones, setAsignaciones] = useState<Record<string, PacienteSugerido[]>>({});
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadBoardData();
    }, []);

    const loadBoardData = async () => {
        setLoading(true);
        try {
            console.log('[DEBUG UI] Solicitando sugerencias al programacionService...');
            const sugerencias = await fetchSugerenciasAccion();
            console.log('[DEBUG UI] Respuesta del servicio:', sugerencias);

            setGrupoA(sugerencias.grupoA);
            setGrupoB(sugerencias.grupoB);

            const hoyStr = new Date().toISOString().split('T')[0];
            const agenda = await agendaService.getAgenda(hoyStr, '2099-12-31');
            console.log('[DEBUG UI] Quirófanos cargados:', agenda.length);
            setQuirofanosSemana(agenda);

            const inicialAsignaciones: Record<string, PacienteSugerido[]> = {};
            agenda.forEach(q => {
                inicialAsignaciones[q.id_quirofano] = [];
            });
            setAsignaciones(inicialAsignaciones);

        } catch (error: any) {
            console.error('Error al cargar datos del tablero:', error);
            alert(`Error consultando la base de datos: ${error?.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = () => { };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const pacienteIdStr = String(active.id).replace('paciente-', '');
        let quirofanoIdDestino = String(over.id).replace('quirofano-', '');
        let overPacienteIdStr: string | null = null;

        if (String(over.id).startsWith('paciente-')) {
            const overRdq = String(over.id).replace('paciente-', '');
            overPacienteIdStr = overRdq;
            let found = false;
            for (const [qId, pacientesEnQ] of Object.entries(asignaciones)) {
                if (pacientesEnQ.some(p => p.rdq.toString() === overRdq)) {
                    quirofanoIdDestino = qId;
                    found = true;
                    break;
                }
            }
            if (!found) return; // Drop inválido
        }

        const pEnA = grupoA.find(p => p.rdq.toString() === pacienteIdStr);
        const pEnB = grupoB.find(p => p.rdq.toString() === pacienteIdStr);
        const pacienteObj = pEnA || pEnB;

        if (!pacienteObj) {
            // Caso B: Reordenando un paciente ya asignado dentro del mismo quirófano
            let sourceQuirofanoId: string | null = null;
            let draggedPatient: PacienteSugerido | null = null;

            for (const [qId, pacientesEnQ] of Object.entries(asignaciones)) {
                const foundP = pacientesEnQ.find(p => p.rdq.toString() === pacienteIdStr);
                if (foundP) {
                    sourceQuirofanoId = qId;
                    draggedPatient = foundP;
                    break;
                }
            }

            if (draggedPatient && sourceQuirofanoId === quirofanoIdDestino && overPacienteIdStr) {
                // Reordenar internamente
                const currentArray = asignaciones[sourceQuirofanoId];
                const oldIndex = currentArray.findIndex(p => p.rdq.toString() === pacienteIdStr);
                const newIndex = currentArray.findIndex(p => p.rdq.toString() === overPacienteIdStr);

                const newArray = arrayMove(currentArray, oldIndex, newIndex);

                setAsignaciones(prev => ({ ...prev, [sourceQuirofanoId!]: newArray }));

                try {
                    const rdqs = newArray.map(p => Number(p.rdq));
                    await actualizarOrdenPacientesAccion(sourceQuirofanoId, rdqs);
                } catch (error) {
                    console.error("Error al reordenar:", error);
                    setAsignaciones(prev => ({ ...prev, [sourceQuirofanoId!]: currentArray }));
                    alert('Error persistiendo el reorden. Cambios revertidos.');
                }
            }
            return;
        }

        // Caso A: Asignar un nuevo paciente desde Sugerencias
        if (pEnA) setGrupoA(prev => prev.filter(p => p.rdq !== pacienteObj.rdq));
        if (pEnB) setGrupoB(prev => prev.filter(p => p.rdq !== pacienteObj.rdq));

        let newOrder: PacienteSugerido[] = [];
        setAsignaciones(prev => {
            const current = prev[quirofanoIdDestino] || [];

            // Si el drop fue sobre un paciente específico, lo insertamos en su posición
            if (overPacienteIdStr) {
                const overIndex = current.findIndex(p => p.rdq.toString() === overPacienteIdStr);
                if (overIndex >= 0) {
                    const arrayCopy = [...current];
                    arrayCopy.splice(overIndex, 0, pacienteObj);
                    newOrder = arrayCopy;
                    return { ...prev, [quirofanoIdDestino]: arrayCopy };
                }
            }

            newOrder = [...current, pacienteObj];
            return { ...prev, [quirofanoIdDestino]: newOrder };
        });

        // Persistencia a DB para nuevo paciente
        try {
            await asignarPacienteAccion(
                quirofanoIdDestino,
                Number(pacienteObj.rdq),
                newOrder.findIndex(p => p.rdq === pacienteObj.rdq) + 1
            );

            // Si lo insertamos en el medio, necesitamos reenumerar el resto llamando a update
            if (overPacienteIdStr) {
                await actualizarOrdenPacientesAccion(quirofanoIdDestino, newOrder.map(p => Number(p.rdq)));
            }
        } catch (error) {
            console.error("Error asignando:", error);
            if (pEnA) setGrupoA(prev => [...prev, pacienteObj].sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales));
            if (pEnB) setGrupoB(prev => [...prev, pacienteObj].sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales));
            setAsignaciones(prev => ({
                ...prev,
                [quirofanoIdDestino]: prev[quirofanoIdDestino].filter(p => p.rdq !== pacienteObj.rdq)
            }));
            alert('Error asignando la paciente. Revertido.');
        }
    };

    if (loading) return <div className={styles.loadingState}>Cargando inteligencia de programación...</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.boardLayout}>
                {/* PANEL IZQUIERDO: Origen (Sugerencias) */}
                <div className={styles.suggestionsPanel}>
                    <h2 className={styles.panelTitle}>Pacientes Sugeridos</h2>
                    <div className={styles.listsContainer}>
                        <div className={styles.suggestionList}>
                            <h3>Grupo A (Mayor / Central) <span className={styles.badge}>{grupoA.length}</span></h3>
                            {grupoA.map(p => (
                                <PatientCard key={p.rdq} paciente={p} />
                            ))}
                        </div>
                        <div className={styles.suggestionList}>
                            <h3>Grupo B (Local / CMA) <span className={styles.badge}>{grupoB.length}</span></h3>
                            {grupoB.map(p => (
                                <PatientCard key={p.rdq} paciente={p} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: Destino (Quirófanos montados) */}
                <div className={styles.agendaPanel}>
                    <h2 className={styles.panelTitle}>Quirófanos Disponibles (Semana)</h2>

                    {quirofanosSemana.length === 0 && (
                        <div className={styles.loadingState} style={{ height: '20vh' }}>
                            <p>No tienes quirófanos montados esta semana.</p>
                        </div>
                    )}

                    <div className={styles.quirofanosGrid}>
                        {quirofanosSemana.map(q => (
                            <QuirofanoDropzone
                                key={q.id_quirofano}
                                quirofano={q}
                                pacientesAsignados={asignaciones[q.id_quirofano] || []}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}
