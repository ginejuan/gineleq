'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { agendaService } from '@/services/agendaService';
import { cirujanosService } from '@/services/cirujanosService';
import { QuirofanoConCirujanos, Cirujano, Quirofano } from '@/types/database';
import { CalendarView } from '@/components/Agenda/CalendarView';
import { QuirofanoModal } from '@/components/Agenda/QuirofanoModal';
import styles from '@/components/Agenda/Agenda.module.css';

export default function AgendaPage() {
    const [agenda, setAgenda] = useState<QuirofanoConCirujanos[]>([]);
    const [cirujanos, setCirujanos] = useState<Cirujano[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorQuery, setErrorQuery] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [quirofanoToEdit, setQuirofanoToEdit] = useState<QuirofanoConCirujanos | undefined>(undefined);

    const fetchAgendaAndCirujanos = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorQuery(null);
            const dataAgenda = await agendaService.getAgenda();
            setAgenda(dataAgenda);

            const dataCirujanos = await cirujanosService.getCirujanos();
            setCirujanos(dataCirujanos);
        } catch (err: unknown) {
            console.error(err);
            setErrorQuery('No se pudo cargar la agenda. Revisa la conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendaAndCirujanos();
    }, [fetchAgendaAndCirujanos]);

    const handleOpenModal = (date?: Date) => {
        setSelectedDate(date || new Date());
        setQuirofanoToEdit(undefined);
        setIsModalOpen(true);
    };

    const handleEditQuirofano = (quirofano: QuirofanoConCirujanos) => {
        setQuirofanoToEdit(quirofano);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDate(undefined);
        setQuirofanoToEdit(undefined);
    };

    const handleSaveQuirofano = async (quirofanoData: Omit<Quirofano, 'id_quirofano' | 'created_at' | 'updated_at'>, cirujanosIds: string[]) => {
        if (quirofanoToEdit) {
            await agendaService.updateQuirofano(quirofanoToEdit.id_quirofano, quirofanoData, cirujanosIds);
        } else {
            await agendaService.createQuirofano(quirofanoData, cirujanosIds);
        }
        await fetchAgendaAndCirujanos();
    };

    const handleDeleteQuirofano = async (id: string, fechaStr: string) => {
        if (window.confirm(`¿Seguro que deseas eliminar el quirófano del ${fechaStr}?`)) {
            try {
                await agendaService.deleteQuirofano(id);
                await fetchAgendaAndCirujanos();
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : 'Error al eliminar');
            }
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Agenda de Quirófanos</h1>
                    <p className={styles.subtitle}>Planificación y montaje de sesiones quirúrgicas.</p>
                </div>
                <button className={styles.btnPrimary} onClick={() => handleOpenModal()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nuevo Quirófano
                </button>
            </header>

            {errorQuery && (
                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
                    {errorQuery}
                </div>
            )}

            {isLoading && !agenda.length ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p className={styles.subtitle}>Cargando agenda...</p>
                </div>
            ) : (
                <CalendarView
                    agendaData={agenda}
                    onDeleteQuirofano={handleDeleteQuirofano}
                    onEditQuirofano={handleEditQuirofano}
                />
            )}

            <QuirofanoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveQuirofano}
                onDelete={handleDeleteQuirofano}
                cirujanosDisponibles={cirujanos}
                initialDate={selectedDate}
                quirofanoToEdit={quirofanoToEdit}
            />
        </div>
    );
}
