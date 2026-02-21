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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { fetchSugerenciasAccion, asignarPacienteAccion, desasignarPacienteAccion } from '@/app/(protected)/programacion/actions';
import { agendaService } from '@/services/agendaService';
import { QuirofanoConCirujanos } from '@/types/database';
import { PacienteSugerido } from '@/services/programacionService';
import PatientCard from './PatientCard';
import QuirofanoDropzone from './QuirofanoDropzone';
import styles from './Programacion.module.css';

export default function ProgramacionBoard() {
    // --- States ---
    const [grupoA, setGrupoA] = useState<PacienteSugerido[]>([]);
    const [grupoB, setGrupoB] = useState<PacienteSugerido[]>([]);
    const [quirofanosSemana, setQuirofanosSemana] = useState<QuirofanoConCirujanos[]>([]);

    // Estado para mapear QuirofanoID -> Pacientes[] asignados en el tablero (local state)
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

            // TODO: Determinar la semana actual y traer quirófanos. 
            // Aquí traemos todos los del futuro próximo por simplicidad
            const hoyStr = new Date().toISOString().split('T')[0];
            const agenda = await agendaService.getAgenda(hoyStr, '2099-12-31');
            console.log('[DEBUG UI] Quirófanos cargados:', agenda.length);
            setQuirofanosSemana(agenda);

            // Cargar asignaciones reales desde Supabase si existieran... 
            // Por ahora, inicializamos vacíos.
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

    // --- Drag & Drop Handlers ---
    const handleDragStart = (/* event: DragStartEvent */) => {
        // const { active } = event;
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        // active.id = "paciente-123", over.id = "quirofano-456"
        const pacienteIdStr = String(active.id).replace('paciente-', '');
        const quirofanoIdDestino = String(over.id).replace('quirofano-', '');

        // 1. Encontrar al paciente en Grupos A o B
        const pEnA = grupoA.find(p => p.rdq.toString() === pacienteIdStr);
        const pEnB = grupoB.find(p => p.rdq.toString() === pacienteIdStr);
        const pacienteObj = pEnA || pEnB;

        if (!pacienteObj) return; // Podría estar ya asignado (re-arrastrando entre quirófanos, a implementar en Fase 2)

        // 2. Optimistic UI Update (quitar de la lista, meter en el Quirofano)
        if (pEnA) setGrupoA(prev => prev.filter(p => p.rdq !== pacienteObj.rdq));
        if (pEnB) setGrupoB(prev => prev.filter(p => p.rdq !== pacienteObj.rdq));

        setAsignaciones(prev => {
            const current = prev[quirofanoIdDestino] || [];
            return {
                ...prev,
                [quirofanoIdDestino]: [...current, pacienteObj]
            };
        });

        // 3. Persistencia Real en Base de Datos
        try {
            await asignarPacienteAccion(quirofanoIdDestino, Number(pacienteObj.rdq));
        } catch (error) {
            console.error("Error asignando en Base de Datos:", error);
            // Revertir UI si falla (rollback)
            if (pEnA) setGrupoA(prev => [...prev, pacienteObj].sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales));
            if (pEnB) setGrupoB(prev => [...prev, pacienteObj].sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales));
            setAsignaciones(prev => ({
                ...prev,
                [quirofanoIdDestino]: prev[quirofanoIdDestino].filter(p => p.rdq !== pacienteObj.rdq)
            }));
            alert('Error al guardar el paciente en el quirófano. Cambios revertidos.');
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
