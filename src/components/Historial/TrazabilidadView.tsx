'use client';

import { useState } from 'react';
import {
    buscarCandidatasAction,
    getViajeAction,
    PacienteCandidato,
    ViajeEntry,
} from '@/app/(protected)/historial/trazabilidad-actions';
import PatientTimeline from './PatientTimeline';
import styles from './TrazabilidadView.module.css';

type Step = 'idle' | 'loading' | 'candidates' | 'loadingViaje' | 'timeline' | 'error';

export default function TrazabilidadView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<Step>('idle');
    const [error, setError] = useState<string | null>(null);
    const [candidatos, setCandidatos] = useState<PacienteCandidato[]>([]);
    const [viaje, setViaje] = useState<ViajeEntry[]>([]);
    const [seleccionada, setSeleccionada] = useState<PacienteCandidato | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setStep('loading');
        setError(null);
        setCandidatos([]);
        setViaje([]);
        setSeleccionada(null);

        try {
            const results = await buscarCandidatasAction(searchTerm);
            if (results.length === 0) {
                setError('No se encontró ninguna paciente con ese identificador o nombre.');
                setStep('error');
                return;
            }

            // Si es búsqueda por RDQ y solo hay 1 resultado → ir directo al timeline
            const isNumeric = /^\d+$/.test(searchTerm.trim());
            if (isNumeric && results.length === 1) {
                await loadViaje(results[0]);
                return;
            }

            setCandidatos(results);
            setStep('candidates');
        } catch (err: any) {
            setError(err.message ?? 'Error en la búsqueda');
            setStep('error');
        }
    };

    const loadViaje = async (candidato: PacienteCandidato) => {
        setSeleccionada(candidato);
        setStep('loadingViaje');
        try {
            const data = await getViajeAction(candidato);
            setViaje(data);
            setStep('timeline');
        } catch (err: any) {
            setError(err.message ?? 'Error cargando el viaje');
            setStep('error');
        }
    };

    const handleReset = () => {
        setStep('idle');
        setSearchTerm('');
        setCandidatos([]);
        setViaje([]);
        setSeleccionada(null);
        setError(null);
    };

    // Agrupar candidatos por "identidad de paciente" para el display
    const gruposCandidatos = (() => {
        const groups: Record<string, PacienteCandidato[]> = {};
        for (const c of candidatos) {
            const key = c.tieneNhc ? `nhc:${c.nhcBlindIndex}` : `name:${c.pacienteBlindIndex}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(c);
        }
        return Object.values(groups);
    })();

    return (
        <div className={styles.trazabilidadContainer}>
            {/* Buscador */}
            <div className={styles.searchSection}>
                <h2 className={styles.sectionTitle}>Trazabilidad · El Viaje de la Paciente</h2>
                <p className={styles.sectionSubtitle}>
                    Introduce el <strong>RDQ</strong> (exacto) o cualquier parte del <strong>nombre y apellidos</strong>.
                    Si hay varias coincidencias, selecciona la paciente correcta antes de ver su historial completo.
                </p>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        placeholder="Ej: 1234  o  García López María"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                        disabled={step === 'loading' || step === 'loadingViaje'}
                    />
                    <button
                        type="submit"
                        className={styles.searchButton}
                        disabled={step === 'loading' || step === 'loadingViaje' || !searchTerm.trim()}
                    >
                        {step === 'loading' ? '⏳ Buscando...' : '🔍 Buscar'}
                    </button>
                    {step !== 'idle' && (
                        <button type="button" onClick={handleReset} className={styles.resetButton}>
                            ✕ Nueva búsqueda
                        </button>
                    )}
                </form>

                {step === 'error' && (
                    <div className={styles.errorMessage}>⚠️ {error}</div>
                )}
            </div>

            {/* PASO 1: Lista de candidatas */}
            {step === 'candidates' && (
                <div className={styles.candidatesSection}>
                    <h3 className={styles.candidatesTitle}>
                        {gruposCandidatos.length === 1
                            ? '1 paciente encontrada — ¿Confirmas que es ella?'
                            : `${gruposCandidatos.length} pacientes${candidatos.length > gruposCandidatos.length ? ` (${candidatos.length} registros en total)` : ''} — Selecciona la correcta:`}
                    </h3>
                    <div className={styles.candidatesList}>
                        {gruposCandidatos.map((grupo, gIdx) => {
                            // Cada grupo es la misma identidad con potencialmente varios RDQs (episodios)
                            const rep = grupo[0]; // Representante del grupo
                            return (
                                <button
                                    key={gIdx}
                                    className={styles.candidateCard}
                                    onClick={() => loadViaje(rep)}
                                >
                                    <div className={styles.candidateName}>{rep.paciente}</div>
                                    <div className={styles.candidateMeta}>
                                        {rep.tieneNhc
                                            ? <span className={styles.nhcBadge}>🆔 NH: {rep.nhc}</span>
                                            : <span className={styles.noNhcBadge}>⚠️ Sin NHC (agrupado por nombre)</span>
                                        }
                                        <span className={styles.rdqList}>
                                            RDQ{grupo.length > 1 ? 's' : ''}: {grupo.map(c => c.rdq).join(', ')}
                                        </span>
                                    </div>
                                    <div className={styles.candidateDiag}>{rep.diagnostico}</div>
                                    <div className={styles.candidateEpisodes}>
                                        {grupo.length} episodio{grupo.length > 1 ? 's' : ''} en lista de espera
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Loading viaje */}
            {step === 'loadingViaje' && (
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Cargando historial completo de {seleccionada?.paciente}...</p>
                </div>
            )}

            {/* PASO 2: Timeline */}
            {step === 'timeline' && viaje.length > 0 && (
                <div className={styles.resultsSection}>
                    <div className={styles.resultsHeader}>
                        <h3 className={styles.resultsTitle}>
                            Trayectoria de: <strong>{viaje[0].candidato.paciente}</strong>
                        </h3>
                        {!viaje[0].candidato.tieneNhc && (
                            <div className={styles.noNhcWarning}>
                                ⚠️ Esta paciente no tiene NHC registrado en el sistema (importado desde AGD sin NHC de DIRAYA).
                                La agrupación se ha realizado por nombre completo; si hay homónimas, pueden aparecer episodios de distintas pacientes.
                            </div>
                        )}
                        <p className={styles.resultsSubtitle}>
                            {viaje.length} registro{viaje.length > 1 ? 's' : ''} en la lista de espera •{' '}
                            {viaje.reduce((acc, v) => acc + v.quirofanos.length, 0)} programación{viaje.reduce((acc, v) => acc + v.quirofanos.length, 0) !== 1 ? 'es' : ''} en quirófano
                        </p>
                    </div>
                    <div className={styles.timelineContainer}>
                        {viaje.map((entry, idx) => (
                            <PatientTimeline key={`entry-${idx}`} viaje={entry} showRdqHeader={viaje.length > 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
