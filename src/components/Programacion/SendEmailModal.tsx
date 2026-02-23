'use client';

import React, { useState, useEffect } from 'react';
import { ListaDistribucion } from '@/types/database';
import { getListasAction } from '@/app/(protected)/listas/actions';
import styles from './SendEmailModal.module.css';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    cirujanosMails: { nombre: string; email: string }[];
    onSend: (to: string[], cc: string[], subject: string, message: string) => Promise<void>;
    defaultSubject: string;
    defaultMessage: string;
}

export function SendEmailModal({ isOpen, onClose, cirujanosMails, onSend, defaultSubject, defaultMessage }: SendEmailModalProps) {
    const [listas, setListas] = useState<ListaDistribucion[]>([]);

    // Selecciones
    const [selectedMails, setSelectedMails] = useState<Set<string>>(new Set());
    const [selectedListas, setSelectedListas] = useState<Set<string>>(new Set());
    const [additionalEmails, setAdditionalEmails] = useState('');

    // Form fields
    const [subject, setSubject] = useState(defaultSubject);
    const [message, setMessage] = useState(defaultMessage);

    // Estado UI
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Load listas on open using Server Action to bypass RLS issues
            getListasAction()
                .then(data => {
                    setListas(data);
                    // Pre-seleccionar listas con envio_automatico
                    const autoListas = new Set<string>();
                    data.forEach(l => {
                        if (l.envio_automatico) autoListas.add(l.id);
                    });
                    setSelectedListas(autoListas);
                })
                .catch(err => console.error("Error fetching listas", err));

            // Default select all surgeons with mails
            const initialSet = new Set<string>();
            cirujanosMails.forEach(c => {
                if (c.email) initialSet.add(c.email);
            });
            setSelectedMails(initialSet);
            setAdditionalEmails('');
            setSubject(defaultSubject);
            setMessage(defaultMessage);
            setError(null);
            setIsSending(false);
        }
    }, [isOpen, cirujanosMails, defaultSubject, defaultMessage]);

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

        const toDestinations = new Set<string>();
        const ccDestinations = new Set<string>(selectedMails); // Cirujanos siempre CC

        // Add all emails from selected listas
        selectedListas.forEach(listaId => {
            const lista = listas.find(l => l.id === listaId);
            if (lista && lista.correos) {
                if (lista.tipo_destinatario === 'Copia') {
                    lista.correos.forEach(c => ccDestinations.add(c));
                } else {
                    // Default a Principal / TO
                    lista.correos.forEach(c => toDestinations.add(c));
                }
            }
        });

        // Add extra emails a TO
        const extraList = additionalEmails.split(',')
            .map(e => e.trim())
            .filter(e => e !== '');

        extraList.forEach(e => toDestinations.add(e));

        if (toDestinations.size === 0 && ccDestinations.size === 0) {
            setError('Debes seleccionar al menos un destinatario.');
            setIsSending(false);
            return;
        }

        try {
            await onSend(Array.from(toDestinations), Array.from(ccDestinations), subject, message);
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
                                            <span>
                                                <span style={{ fontSize: '10px', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', color: '#475569', fontWeight: 600 }}>CC</span>
                                                {c.nombre} <small className={styles.textMuted}>({c.email})</small>
                                            </span>
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
                                                {l.tipo_destinatario === 'Copia' ? (
                                                    <span style={{ fontSize: '10px', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', color: '#475569', fontWeight: 600 }}>CC</span>
                                                ) : (
                                                    <span style={{ fontSize: '10px', backgroundColor: '#dbeafe', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', color: '#1e40af', fontWeight: 600 }}>Para</span>
                                                )}
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
