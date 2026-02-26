'use client';

import React, { useState, useEffect } from 'react';
import { Cirujano, Quirofano, QuirofanoConCirujanos } from '@/types/database';
import styles from './Agenda.module.css';

interface QuirofanoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quirofanoData: Omit<Quirofano, 'id_quirofano' | 'created_at' | 'updated_at'>, cirujanoIds: string[]) => Promise<void>;
    onDelete?: (id_quirofano: string, fecha: string) => Promise<void>;
    cirujanosDisponibles: Cirujano[];
    initialDate?: Date; // Fecha inicial si se hace clic en el calendario
    quirofanoToEdit?: QuirofanoConCirujanos;
}

export function QuirofanoModal({ isOpen, onClose, onSave, onDelete, cirujanosDisponibles, initialDate, quirofanoToEdit }: QuirofanoModalProps) {
    const [fecha, setFecha] = useState('');
    const [turno, setTurno] = useState('Mañana');
    const [tipoQuirofano, setTipoQuirofano] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [selectedCirujanos, setSelectedCirujanos] = useState<string[]>([]);

    // Searchable Combobox State
    const [searchTerm, setSearchTerm] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter Surgeons
    const filteredCirujanos = cirujanosDisponibles.filter(c => {
        const fullName = `${c.nombre} ${c.apellido1} ${c.apellido2 || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        if (isOpen) {
            if (quirofanoToEdit) {
                setFecha(quirofanoToEdit.fecha);
                setTurno(quirofanoToEdit.turno);
                setTipoQuirofano(quirofanoToEdit.tipo_quirofano || '');
                setObservaciones(quirofanoToEdit.observaciones || '');
                setSelectedCirujanos(quirofanoToEdit.quirofano_cirujano?.map(qc => qc.cirujanos.id_cirujano) || []);
            } else if (initialDate) {
                // Formato YYYY-MM-DD local
                const year = initialDate.getFullYear();
                const month = String(initialDate.getMonth() + 1).padStart(2, '0');
                const day = String(initialDate.getDate()).padStart(2, '0');
                setFecha(`${year}-${month}-${day}`);
                setTurno('Mañana');
                setTipoQuirofano('');
                setObservaciones('');
                setSelectedCirujanos([]);
            } else {
                setFecha('');
                setTurno('Mañana');
                setTipoQuirofano('');
                setObservaciones('');
                setSelectedCirujanos([]);
            }
            setSearchTerm('');
            setError(null);
        }
    }, [isOpen, initialDate, quirofanoToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fecha || !tipoQuirofano) {
            setError('La fecha y el tipo de quirófano son obligatorios.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onSave(
                {
                    fecha,
                    turno,
                    tipo_quirofano: tipoQuirofano.trim() || null,
                    observaciones: observaciones.trim() || null,
                },
                selectedCirujanos
            );
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar el quirófano.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCirujano = (id: string) => {
        setSelectedCirujanos(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Nueva Sesión de Quirófano</h2>
                    <button className={styles.btnIcon} onClick={onClose} aria-label="Cerrar modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className={styles.formGroup} style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label className={styles.label} htmlFor="fecha">Fecha *</label>
                            <input
                                id="fecha"
                                type="date"
                                className={styles.input}
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label className={styles.label} htmlFor="turno">Turno *</label>
                            <select
                                id="turno"
                                className={styles.select}
                                value={turno}
                                onChange={(e) => setTurno(e.target.value)}
                                required
                            >
                                <option value="Mañana">Mañana</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Continuidad asistencial">Continuidad asistencial</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="tipoQuirofano">Tipo de Quirófano *</label>
                        <select
                            id="tipoQuirofano"
                            className={styles.select}
                            value={tipoQuirofano}
                            onChange={(e) => setTipoQuirofano(e.target.value)}
                            required
                        >
                            <option value="">Seleccione un tipo</option>
                            <option value="central">Central</option>
                            <option value="HDQ_con_anestesista">HDQ con Anestesista</option>
                            <option value="HDQ_sin_anestesista">HDQ sin Anestesista</option>
                            <option value="Hosp. La Janda An. General">Hosp. La Janda An. General</option>
                            <option value="Hosp. La Janda An. Local">Hosp. La Janda An. Local</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Facultativos Asignados</label>

                        {/* Selected Surgeons Badges */}
                        {selectedCirujanos.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                {selectedCirujanos.map(id => {
                                    const c = cirujanosDisponibles.find(x => x.id_cirujano === id);
                                    if (!c) return null;
                                    return (
                                        <span key={id} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            backgroundColor: 'var(--color-primary-surface)', color: 'var(--color-primary-dark)',
                                            padding: '4px 8px', borderRadius: '16px', fontSize: '12px', border: '1px solid var(--color-primary-light)'
                                        }}>
                                            {c.nombre} {c.apellido1}
                                            <button
                                                type="button"
                                                onClick={() => toggleCirujano(id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '14px', lineHeight: 1, color: 'var(--color-primary)' }}
                                            >×</button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Searchable Combobox */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Buscar cirujano..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && filteredCirujanos.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                                    maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                                }}>
                                    {filteredCirujanos.map(cirujano => {
                                        const label = `${cirujano.nombre} ${cirujano.apellido1} ${cirujano.apellido2 || ''}`.trim();
                                        const isSelected = selectedCirujanos.includes(cirujano.id_cirujano);
                                        return (
                                            <div
                                                key={cirujano.id_cirujano}
                                                style={{
                                                    padding: '8px 12px', cursor: 'pointer',
                                                    backgroundColor: isSelected ? 'var(--color-bg)' : 'transparent',
                                                    borderBottom: '1px solid var(--color-bg-alt)'
                                                }}
                                                onClick={() => {
                                                    toggleCirujano(cirujano.id_cirujano);
                                                    setSearchTerm(''); // Clear search on select
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{label}</span>
                                                    {(cirujano.onco_gine || cirujano.onco_mama) && (
                                                        <span style={{ fontSize: '10px', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '2px 4px', borderRadius: '4px' }}>
                                                            {cirujano.onco_gine && 'Gine '} {cirujano.onco_mama && 'Mama'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {searchTerm && filteredCirujanos.length === 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                    padding: '8px 12px', fontSize: '13px', color: 'var(--color-text-muted)'
                                }}>
                                    No se encontraron facultativos.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="observaciones">Observaciones</label>
                        <textarea
                            id="observaciones"
                            className={styles.input}
                            rows={3}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Notas adicionales..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className={styles.modalFooter} style={{ justifyContent: quirofanoToEdit ? 'space-between' : 'flex-end', display: 'flex', width: '100%' }}>
                        {quirofanoToEdit && onDelete && (
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                onClick={() => {
                                    onDelete(quirofanoToEdit.id_quirofano, quirofanoToEdit.fecha);
                                    onClose();
                                }}
                                disabled={isSubmitting}
                            >
                                Anular Quirófano
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : (quirofanoToEdit ? 'Actualizar Quirófano' : 'Montar Quirófano')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
