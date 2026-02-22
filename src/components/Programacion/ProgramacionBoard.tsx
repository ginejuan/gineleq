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
    DragStartEvent,
    useDroppable
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { fetchSugerenciasAccion, asignarPacienteAccion, desasignarPacienteAccion, actualizarOrdenPacientesAccion, getAsignacionesAccion, toggleQuirofanoCompletadoAccion } from '@/app/(protected)/programacion/actions';
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

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOncoMama, setFilterOncoMama] = useState(false);
    const [filterOncoGine, setFilterOncoGine] = useState(false);
    const [filterPriorizable, setFilterPriorizable] = useState(false);

    const { setNodeRef: setNodeRefSugerencias } = useDroppable({
        id: 'sugerencias-panel'
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fechas de filtro predeterminadas: Hoy a Hoy + 7 días
    const [fechaInicio, setFechaInicio] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState<string>(() => {
        const f = new Date();
        f.setDate(f.getDate() + 7);
        return f.toISOString().split('T')[0];
    });

    useEffect(() => {
        loadBoardData();
    }, [fechaInicio, fechaFin]);

    const loadBoardData = async () => {
        setLoading(true);
        try {
            console.log('[DEBUG UI] Solicitando sugerencias al programacionService...');
            const sugerencias = await fetchSugerenciasAccion();
            console.log('[DEBUG UI] Respuesta del servicio:', sugerencias);

            setGrupoA(sugerencias.grupoA);
            setGrupoB(sugerencias.grupoB);

            // Using the selected date range instead of hardcoded 'today onwards'
            const agenda = await agendaService.getAgenda(fechaInicio, fechaFin);
            console.log('[DEBUG UI] Quirófanos cargados:', agenda.length);
            setQuirofanosSemana(agenda);

            const qIds = agenda.map(q => q.id_quirofano);
            const dataAsignaciones = await getAsignacionesAccion(qIds);
            setAsignaciones(dataAsignaciones);

        } catch (error: any) {
            console.error('Error al cargar datos del tablero:', error);
            alert(`Error consultando la base de datos: ${error?.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCompletado = async (id_quirofano: string, completado: boolean) => {
        setQuirofanosSemana(prev => prev.map(q =>
            q.id_quirofano === id_quirofano ? { ...q, completado } : q
        ));
        try {
            await toggleQuirofanoCompletadoAccion(id_quirofano, completado);
        } catch (err: any) {
            console.error(err);
            alert('Error al guardar el estado completado.');
            setQuirofanosSemana(prev => prev.map(q =>
                q.id_quirofano === id_quirofano ? { ...q, completado: !completado } : q
            ));
        }
    };

    const handleDragStart = () => { };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const pacienteIdStr = String(active.id).replace('paciente-', '');
        let quirofanoIdDestino = String(over.id).replace('quirofano-', '');
        let overPacienteIdStr: string | null = null;
        let isReturnToSuggestions = over.id === 'sugerencias-panel';

        if (String(over.id).startsWith('paciente-')) {
            const overRdq = String(over.id).replace('paciente-', '');
            overPacienteIdStr = overRdq;

            if (grupoA.some(p => p.rdq.toString() === overRdq) || grupoB.some(p => p.rdq.toString() === overRdq)) {
                isReturnToSuggestions = true;
            } else {
                let found = false;
                for (const [qId, pacientesEnQ] of Object.entries(asignaciones)) {
                    if (pacientesEnQ.some(p => p.rdq.toString() === overRdq)) {
                        quirofanoIdDestino = qId;
                        found = true;
                        break;
                    }
                }
                if (!found && !isReturnToSuggestions) return; // Drop inválido (ej: sobre otro paciente en sugerencias)
            }
        }

        if (isReturnToSuggestions) {
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

            if (draggedPatient && sourceQuirofanoId) {
                // UI update: Quitar del quirófano
                const currentArray = asignaciones[sourceQuirofanoId];
                setAsignaciones(prev => ({
                    ...prev,
                    [sourceQuirofanoId!]: currentArray.filter(p => p.rdq.toString() !== pacienteIdStr)
                }));

                // UI update: Devolver a sugerencias
                const reAddPatient = (prev: PacienteSugerido[]) => {
                    return [...prev, draggedPatient!].sort((a, b) => b.scoreDetails.puntosTotales - a.scoreDetails.puntosTotales);
                };
                if (draggedPatient.grupo === 'A') setGrupoA(reAddPatient);
                else setGrupoB(reAddPatient);

                // Persistencia en BD
                try {
                    await desasignarPacienteAccion(sourceQuirofanoId, Number(draggedPatient.rdq));

                    const rest = currentArray.filter(p => p.rdq.toString() !== pacienteIdStr);
                    if (rest.length > 0) {
                        await actualizarOrdenPacientesAccion(sourceQuirofanoId, rest.map(p => Number(p.rdq)));
                    }
                } catch (error) {
                    console.error("Error unassigning:", error);
                    alert("Error devolviendo la paciente a la lista. Cambios revertidos.");
                    // Rollback
                    setAsignaciones(prev => ({ ...prev, [sourceQuirofanoId!]: currentArray }));
                    if (draggedPatient.grupo === 'A') setGrupoA(prev => prev.filter(p => p.rdq.toString() !== draggedPatient!.rdq.toString()));
                    else setGrupoB(prev => prev.filter(p => p.rdq.toString() !== draggedPatient!.rdq.toString()));
                }
            }
            return;
        }

        // 1. Encontrar al paciente en Grupos A o B
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

    // Lógica de filtrado
    const isPacienteMachingFilters = (p: PacienteSugerido) => {
        // 1. Búsqueda por texto libre
        if (searchTerm.trim()) {
            const terms = searchTerm.toLowerCase().trim().split(' ');
            const fullName = p.paciente ? p.paciente.toLowerCase() : '';
            const nhc = p.nhc ? p.nhc.toLowerCase() : '';
            const rdqStr = p.rdq.toString();

            const searchString = `${fullName} ${nhc} ${rdqStr}`;
            if (!terms.every(term => searchString.includes(term))) {
                return false;
            }
        }

        // 2. Filtros Clínicos
        const diag = p.diagnostico?.trim().toUpperCase() || '';
        const isMama = diag.startsWith('NEOPLASIA MALIGNA MAMA');
        const isGine = diag.startsWith('NEOPLASIA MALIGNA') && !isMama;

        if (filterOncoMama || filterOncoGine) {
            let matchesOnco = false;
            if (filterOncoMama && isMama) matchesOnco = true;
            if (filterOncoGine && isGine) matchesOnco = true;
            if (!matchesOnco) return false;
        }

        if (filterPriorizable && !p.priorizable) return false;

        return true;
    };

    const filteredGrupoA = grupoA.filter(isPacienteMachingFilters);
    const filteredGrupoB = grupoB.filter(isPacienteMachingFilters);

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
                <div ref={setNodeRefSugerencias} className={styles.suggestionsPanel}>
                    <h2 className={styles.panelTitle}>Pacientes Sugeridos</h2>

                    {/* Fila de Filtros */}
                    <div className={styles.filtersSection}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Buscar por Nombre, NHC o RDQ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.clinicalFiltersBox}>
                            <label className={`${styles.filterToggle} ${filterOncoMama ? styles.activeOnco : ''}`}>
                                <input type="checkbox" checked={filterOncoMama} onChange={e => setFilterOncoMama(e.target.checked)} />
                                Onco Mama
                            </label>
                            <label className={`${styles.filterToggle} ${filterOncoGine ? styles.activeOnco : ''}`}>
                                <input type="checkbox" checked={filterOncoGine} onChange={e => setFilterOncoGine(e.target.checked)} />
                                Onco Gine
                            </label>
                            <label className={`${styles.filterToggle} ${filterPriorizable ? styles.activePriorizable : ''}`}>
                                <input type="checkbox" checked={filterPriorizable} onChange={e => setFilterPriorizable(e.target.checked)} />
                                Priorizables
                            </label>
                        </div>
                    </div>

                    <div className={styles.listsContainer}>
                        <div className={styles.suggestionList}>
                            <h3>Grupo A (Con anestesista) <span className={styles.badge}>{filteredGrupoA.length}</span></h3>
                            {filteredGrupoA.map(p => (
                                <PatientCard key={p.rdq} paciente={p} />
                            ))}
                        </div>
                        <div className={styles.suggestionList}>
                            <h3>Grupo B (Anestesia local) <span className={styles.badge}>{filteredGrupoB.length}</span></h3>
                            {filteredGrupoB.map(p => (
                                <PatientCard key={p.rdq} paciente={p} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: Destino (Quirófanos montados) */}
                <div className={styles.agendaPanel}>
                    <div className={styles.agendaPanelHeader}>
                        <h2 className={styles.panelTitle}>Quirófanos Disponibles</h2>
                        <div className={styles.dateFilterContainer}>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className={styles.dateFilterInput}
                            />
                            <span>a</span>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className={styles.dateFilterInput}
                            />
                        </div>
                    </div>

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
                                onToggleCompletado={handleToggleCompletado}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}
