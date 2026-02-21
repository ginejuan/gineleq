'use client';

import React, { useState, useEffect } from 'react';
import { Cirujano } from '@/types/database';
import styles from './Surgeons.module.css';

interface SurgeonsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cirujano: Omit<Cirujano, 'id_cirujano' | 'created_at' | 'updated_at'>) => Promise<void>;
    cirujanoToEdit?: Cirujano;
}

export function SurgeonsModal({ isOpen, onClose, onSave, cirujanoToEdit }: SurgeonsModalProps) {
    const [nombre, setNombre] = useState('');
    const [apellido1, setApellido1] = useState('');
    const [apellido2, setApellido2] = useState('');
    const [telefonoMovil, setTelefonoMovil] = useState('');
    const [email, setEmail] = useState('');
    const [oncoGine, setOncoGine] = useState(false);
    const [oncoMama, setOncoMama] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (cirujanoToEdit) {
                setNombre(cirujanoToEdit.nombre);
                setApellido1(cirujanoToEdit.apellido1);
                setApellido2(cirujanoToEdit.apellido2 || '');
                setTelefonoMovil(cirujanoToEdit.telefono_movil || '');
                setEmail(cirujanoToEdit.e_mail || '');
                setOncoGine(cirujanoToEdit.onco_gine);
                setOncoMama(cirujanoToEdit.onco_mama);
            } else {
                // Reset form
                setNombre('');
                setApellido1('');
                setApellido2('');
                setTelefonoMovil('');
                setEmail('');
                setOncoGine(false);
                setOncoMama(false);
            }
            setError(null);
        }
    }, [isOpen, cirujanoToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !apellido1.trim()) {
            setError('Nombre y primer apellido son obligatorios.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onSave({
                nombre: nombre.trim(),
                apellido1: apellido1.trim(),
                apellido2: apellido2.trim() || null,
                telefono_movil: telefonoMovil.trim() || null,
                e_mail: email.trim() || null,
                onco_gine: oncoGine,
                onco_mama: oncoMama,
            });
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar el cirujano.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {cirujanoToEdit ? 'Editar Facultativo' : 'Nuevo Facultativo'}
                    </h2>
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
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="nombre">Nombre *</label>
                        <input
                            id="nombre"
                            type="text"
                            className={styles.input}
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. María"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label className={styles.label} htmlFor="apellido1">Primer Apellido *</label>
                            <input
                                id="apellido1"
                                type="text"
                                className={styles.input}
                                value={apellido1}
                                onChange={(e) => setApellido1(e.target.value)}
                                placeholder="Ej. García"
                                required
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label className={styles.label} htmlFor="apellido2">Segundo Apellido</label>
                            <input
                                id="apellido2"
                                type="text"
                                className={styles.input}
                                value={apellido2}
                                onChange={(e) => setApellido2(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@hospital.es"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="telefono">Teléfono</label>
                        <input
                            id="telefono"
                            type="tel"
                            className={styles.input}
                            value={telefonoMovil}
                            onChange={(e) => setTelefonoMovil(e.target.value)}
                            placeholder="Ej. 600123456"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subespecialidades</label>
                        <div className={styles.checkboxGroup}>
                            <input
                                id="oncoGine"
                                type="checkbox"
                                className={styles.checkbox}
                                checked={oncoGine}
                                onChange={(e) => setOncoGine(e.target.checked)}
                            />
                            <label htmlFor="oncoGine" className={styles.checkboxLabel}>Oncología Ginecológica</label>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                id="oncoMama"
                                type="checkbox"
                                className={styles.checkbox}
                                checked={oncoMama}
                                onChange={(e) => setOncoMama(e.target.checked)}
                            />
                            <label htmlFor="oncoMama" className={styles.checkboxLabel}>Oncología de Mama</label>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Facultativo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
