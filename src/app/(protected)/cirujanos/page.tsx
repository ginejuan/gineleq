'use client';

import React, { useState, useEffect } from 'react';
import { cirujanosService } from '@/services/cirujanosService';
import { Cirujano } from '@/types/database';
import { SurgeonsTable } from '@/components/Surgeons/SurgeonsTable';
import { SurgeonsModal } from '@/components/Surgeons/SurgeonsModal';
import styles from '@/components/Surgeons/Surgeons.module.css';

export default function CirujanosPage() {
    const [cirujanos, setCirujanos] = useState<Cirujano[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorQuery, setErrorQuery] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cirujanoToEdit, setCirujanoToEdit] = useState<Cirujano | undefined>(undefined);

    const fetchCirujanos = async () => {
        try {
            setIsLoading(true);
            setErrorQuery(null);
            const data = await cirujanosService.getCirujanos();
            setCirujanos(data);
        } catch (err: unknown) {
            console.error(err);
            setErrorQuery('No se pudieron cargar los facultativos. Revisa la conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCirujanos();
    }, []);

    const handleOpenModal = (cirujano?: Cirujano) => {
        setCirujanoToEdit(cirujano);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCirujanoToEdit(undefined);
    };

    const handleSaveCirujano = async (cirujanoData: Omit<Cirujano, 'id_cirujano' | 'created_at' | 'updated_at'>) => {
        if (cirujanoToEdit) {
            await cirujanosService.updateCirujano(cirujanoToEdit.id_cirujano, cirujanoData);
        } else {
            await cirujanosService.createCirujano(cirujanoData);
        }
        // Refresh table
        await fetchCirujanos();
    };

    const handleDeleteCirujano = async (id: string, nombreCompleto: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombreCompleto}? Esta acción no se puede deshacer.`)) {
            try {
                await cirujanosService.deleteCirujano(id);
                await fetchCirujanos();
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : 'Error al eliminar el cirujano.');
            }
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestión de Facultativos</h1>
                    <p className={styles.subtitle}>Administra los cirujanos disponibles para el montaje de quirófanos.</p>
                </div>
                <button className={styles.btnPrimary} onClick={() => handleOpenModal()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Añadir Cirujano
                </button>
            </header>

            {errorQuery && (
                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
                    {errorQuery}
                </div>
            )}

            <SurgeonsTable
                cirujanos={cirujanos}
                isLoading={isLoading}
                onEdit={handleOpenModal}
                onDelete={handleDeleteCirujano}
            />

            <SurgeonsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveCirujano}
                cirujanoToEdit={cirujanoToEdit}
            />
        </div>
    );
}
