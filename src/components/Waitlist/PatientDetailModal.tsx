'use client';

import { useState } from 'react';
import { type WaitlistRow } from '@/lib/waitlist/waitlist-data';
import { updatePatientManualFields } from '@/app/(protected)/lista-espera/actions';
import styles from './Waitlist.module.css';

interface PatientDetailModalProps {
    patient: WaitlistRow;
    onClose: () => void;
}

export function PatientDetailModal({ patient, onClose }: PatientDetailModalProps) {
    const [priorizable, setPriorizable] = useState(patient.priorizable);
    const [suspendida, setSuspendida] = useState(patient.suspendida);
    const [comentarios, setComentarios] = useState(patient.comentarios || '');
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        setIsSaving(true);
        try {
            await updatePatientManualFields(patient.rdq, { priorizable, comentarios, suspendida });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
        }} onClick={onClose}>
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    width: '100%',
                    maxWidth: '36rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Ficha del Paciente</h2>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>RDQ: {patient.rdq}</span>
                    </div>
                    <button onClick={onClose} style={{ color: '#94a3b8', fontSize: '1.5rem', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {/* Read-only details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Paciente</label>
                            <div style={{ fontWeight: 500, color: '#0f172a' }}>{patient.paciente}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>NHC</label>
                            <div style={{ fontFamily: 'monospace', color: '#334155', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'inline-block' }}>{patient.nhc}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Diagnóstico</label>
                            <div style={{ color: '#334155', fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #f1f5f9' }}>{patient.diagnostico}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Procedimiento</label>
                            <div style={{ color: '#334155', fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #f1f5f9' }}>{patient.procedimiento}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Fecha Preanestesia</label>
                            <div style={{ color: '#334155', fontSize: '0.875rem', backgroundColor: '#f0f9ff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e0f2fe' }}>
                                {patient.f_preanestesia ? new Date(patient.f_preanestesia).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'No asignada'}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Resultado Anestesia</label>
                            <div style={{
                                color: patient.rdo_preanestesia?.toUpperCase() === 'APTO' ? '#166534' : '#991b1b',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                backgroundColor: patient.rdo_preanestesia?.toUpperCase() === 'APTO' ? '#f0fdf4' : '#fef2f2',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: `1px solid ${patient.rdo_preanestesia?.toUpperCase() === 'APTO' ? '#dcfce7' : '#fee2e2'}`
                            }}>
                                {patient.rdo_preanestesia || 'Pendiente'}
                            </div>
                        </div>
                        {patient.observaciones && (
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Observaciones (Excel)</label>
                                <div style={{ color: '#475569', fontSize: '0.875rem', whiteSpace: 'pre-wrap', backgroundColor: '#fff7ed', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #ffedd5' }}>
                                    {patient.observaciones}
                                </div>
                            </div>
                        )}
                    </div>

                    <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', marginBottom: '1.5rem' }} />

                    {/* Editable Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="priorizable"
                                checked={priorizable}
                                onChange={e => setPriorizable(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', borderColor: '#d1d5db', color: '#7c3aed' }}
                            />
                            <label htmlFor="priorizable" style={{ fontWeight: 500, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                Marcar como Priorizable
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Resalta en violeta en el listado)</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="suspendida"
                                checked={suspendida}
                                onChange={e => setSuspendida(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', borderColor: '#d1d5db', color: '#ef4444' }}
                            />
                            <label htmlFor="suspendida" style={{ fontWeight: 500, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                Marcar como Suspendida
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Programada y cancelada por falta de tiempo/complicaciones)</span>
                            </label>
                        </div>

                        <div>
                            <label htmlFor="comentarios" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>Comentarios Clínicos / Observaciones</label>
                            <textarea
                                id="comentarios"
                                value={comentarios}
                                onChange={e => setComentarios(e.target.value)}
                                rows={4}
                                style={{ width: '100%', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.75rem', fontSize: '0.875rem' }}
                                placeholder="Escribe aquí notas adicionales..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    borderTop: '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#334155',
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.375rem',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'white',
                            backgroundColor: '#7c3aed',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
