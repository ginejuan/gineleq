'use client';

import React, { useState, useEffect } from 'react';
import { ListaDistribucion } from '@/types/database';
import styles from './Listas.module.css';

interface ListasModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lista: Omit<ListaDistribucion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    listaToEdit?: ListaDistribucion;
}

export function ListasModal({ isOpen, onClose, onSave, listaToEdit }: ListasModalProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [correos, setCorreos] = useState<string[]>(['']);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (listaToEdit) {
                setNombre(listaToEdit.nombre);
                setDescripcion(listaToEdit.descripcion || '');
                setCorreos(listaToEdit.correos && listaToEdit.correos.length > 0 ? listaToEdit.correos : ['']);
            } else {
                setNombre('');
                setDescripcion('');
                setCorreos(['']);
            }
            setError(null);
        }
    }, [isOpen, listaToEdit]);

    if (!isOpen) return null;

    const handleAddEmail = () => {
        setCorreos([...correos, '']);
    };

    const handleRemoveEmail = (index: number) => {
        const newCorreos = [...correos];
        newCorreos.splice(index, 1);
        setCorreos(newCorreos.length ? newCorreos : ['']);
    };

    const handleEmailChange = (index: number, value: string) => {
        const newCorreos = [...correos];
        newCorreos[index] = value;
        setCorreos(newCorreos);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            setError('El nombre de la lista es obligatorio.');
            return;
        }

        // Clean up empty emails
        const validEmails = correos
            .map(e => e.trim())
            .filter(e => e !== '');

        // Basic validation for format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = validEmails.filter(e => !emailRegex.test(e));

        if (invalidEmails.length > 0) {
            setError(`Formatos de correo inválidos: ${invalidEmails.join(', ')}`);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onSave({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                correos: validEmails,
            });
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar la lista.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {listaToEdit ? 'Editar Lista de Distribución' : 'Nueva Lista de Distribución'}
                    </h2>
                    <button className={styles.btnIcon} onClick={onClose} aria-label="Cerrar modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.formGroup} style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-danger-light)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)' }}>
                            {error}
                        </div>
                    )}

                    <form id="listaForm" onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="nombre">Nombre de la Lista *</label>
                            <input
                                id="nombre"
                                type="text"
                                className={styles.input}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej. Servicio de Anestesia"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="descripcion">Descripción</label>
                            <textarea
                                id="descripcion"
                                className={styles.textarea}
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Breve descipción de esta lista..."
                                rows={2}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Correos Electrónicos</label>
                            <p className={styles.subtitle} style={{ marginBottom: '8px', fontSize: '12px' }}>Añade todas las direcciones de email que componen esta lista.</p>

                            <div className={styles.emailsList}>
                                {correos.map((correo, index) => (
                                    <div key={index} className={styles.emailRow}>
                                        <input
                                            type="email"
                                            className={styles.input}
                                            style={{ flex: 1 }}
                                            value={correo}
                                            onChange={(e) => handleEmailChange(index, e.target.value)}
                                            placeholder="correo@ejemplo.com"
                                        />
                                        <button
                                            type="button"
                                            className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                                            onClick={() => handleRemoveEmail(index)}
                                            title="Eliminar correo"
                                            tabIndex={-1}
                                        >
                                            ✖️
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={styles.addEmailBtn}
                                onClick={handleAddEmail}
                            >
                                + Añadir otro correo
                            </button>
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" form="listaForm" className={styles.btnPrimary} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Lista'}
                    </button>
                </div>
            </div>
        </div>
    );
}
