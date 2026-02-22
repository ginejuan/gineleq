'use client';

import React, { useState, useEffect } from 'react';
import { ListaDistribucion } from '@/types/database';
import { listasService } from '@/services/listasService';
import styles from './SendEmailModal.module.css';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    cirujanosMails: { nombre: string; email: string }[];
    onSend: (destinatarios: string[], subject: string, message: string) => Promise<void>;
    fechaParte: string;
}

export function SendEmailModal({ isOpen, onClose, cirujanosMails, onSend, fechaParte }: SendEmailModalProps) {
    const [listas, setListas] = useState<ListaDistribucion[]>([]);

    // Selecciones
    const [selectedMails, setSelectedMails] = useState<Set<string>>(new Set());
    const [selectedListas, setSelectedListas] = useState<Set<string>>(new Set());
    const [additionalEmails, setAdditionalEmails] = useState('');

    // Form fields
    const [subject, setSubject] = useState(`Parte de Quirófano - ${fechaParte}`);
    const [message, setMessage] = useState('Adjunto enviamos el parte quirúrgico definitivo para la sesión indicada.');

    // Estado UI
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Load listas on open
            listasService.getListas()
                .then(data => setListas(data))
                .catch(err => console.error("Error fetching listas", err));

            // Default select all surgeons with mails
            const initialSet = new Set<string>();
            cirujanosMails.forEach(c => {
                if (c.email) initialSet.add(c.email);
            });
            setSelectedMails(initialSet);
            setSelectedListas(new Set());
            setAdditionalEmails('');
            setError(null);
            setIsSending(false);
        }
    }, [isOpen, cirujanosMails]);

    if (!isOpen) return null;

    const toggleMail = (email: string) => {
        const next = new Set(selectedMails);
        if (next.has(email)) next.delete(email);
        else next.add(email);
        setSelectedMails(next);
    };

    const toggleLista = (id: string) => {
        const next = new Set(selectedListas);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedListas(next);
    };

    const handleSendClick = async () => {
        setIsSending(true);
        setError(null);

        // Gather all emails
        const finalDestinations = new Set<string>(selectedMails);

        // Add all emails from selected listas
        selectedListas.forEach(listaId => {
            const lista = listas.find(l => l.id === listaId);
            if (lista && lista.correos) {
                lista.correos.forEach(c => finalDestinations.add(c));
            }
        });

        // Add extra emails
        const extraList = additionalEmails.split(',')
            .map(e => e.trim())
            .filter(e => e !== '');

        extraList.forEach(e => finalDestinations.add(e));

        if (finalDestinations.size === 0) {
            setError('Debes seleccionar al menos un destinatario.');
            setIsSending(false);
            return;
        }

        try {
            await onSend(Array.from(finalDestinations), subject, message);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error inesperado al enviar el correo.');
            setIsSending(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={!isSending ? onClose : undefined}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>✉️ Enviar Parte por Email</h2>
                    {!isSending && (
                        <button className={styles.btnIcon} onClick={onClose} aria-label="Cerrar modal">
                            ✖️
                        </button>
                    )}
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.helpText}>Selecciona a quién quieres enviar el PDF generado a partir del documento actual en pantalla.</p>

                    {error && (
                        <div className={styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    <div className={styles.sectionRow}>
                        {/* Izquierda: Destinatarios */}
                        <div className={styles.formColumn}>
                            <h3>1. Destinatarios</h3>

                            {/* Cirujanos */}
                            <div className={styles.subSection}>
                                <h4>Facultativos Asignados</h4>
                                {cirujanosMails.length === 0 ? (
                                    <p className={styles.textMuted}>Ningún facultativo asignado a este quirófano tiene email registrado.</p>
                                ) : (
                                    cirujanosMails.map(c => (
                                        <label key={c.email} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedMails.has(c.email)}
                                                onChange={() => toggleMail(c.email)}
                                                disabled={isSending}
                                            />
                                            <span>{c.nombre} <small className={styles.textMuted}>({c.email})</small></span>
                                        </label>
                                    ))
                                )}
                            </div>

                            {/* Listas */}
                            <div className={styles.subSection}>
                                <h4>Listas de Distribución</h4>
                                {listas.length === 0 ? (
                                    <p className={styles.textMuted} style={{ fontSize: '11px' }}>No hay listas creadas. Ve al menú "Listas Correo" para crearlas.</p>
                                ) : (
                                    listas.map(l => (
                                        <label key={l.id} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedListas.has(l.id)}
                                                onChange={() => toggleLista(l.id)}
                                                disabled={isSending}
                                            />
                                            <span>
                                                {l.nombre} <small className={styles.textMuted}>({l.correos?.length || 0} emails)</small>
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>

                            {/* Extra */}
                            <div className={styles.subSection}>
                                <h4>Otros Destinatarios</h4>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="email1@ejemplo.com, email2@ejemplo.es"
                                    value={additionalEmails}
                                    onChange={(e) => setAdditionalEmails(e.target.value)}
                                    disabled={isSending}
                                />
                                <small className={styles.textMuted} style={{ fontSize: '11px' }}>Separados por comas (,)</small>
                            </div>
                        </div>

                        {/* Derecha: Correo */}
                        <div className={styles.formColumn}>
                            <h3>2. Mensaje</h3>

                            <div className={styles.subSection}>
                                <h4>Asunto</h4>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={isSending}
                                />
                            </div>

                            <div className={styles.subSection}>
                                <h4>Cuerpo del mensaje</h4>
                                <textarea
                                    className={styles.textarea}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    disabled={isSending}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSending}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleSendClick}
                        disabled={isSending || (selectedMails.size === 0 && selectedListas.size === 0 && additionalEmails.trim() === '')}
                    >
                        {isSending ? 'Generando PDF y enviando...' : '📄 Generar y Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
