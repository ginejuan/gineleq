'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QuirofanoConCirujanos } from '@/types/database';
import styles from './Agenda.module.css';

interface CalendarViewProps {
    agendaData: QuirofanoConCirujanos[];
    onDeleteQuirofano: (id: string, dateStr: string) => void;
    onEditQuirofano?: (quirofano: QuirofanoConCirujanos) => void;
}

export function CalendarView({ agendaData, onDeleteQuirofano, onEditQuirofano }: CalendarViewProps) {
    const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Context menu state
    interface ContextMenuState {
        quirofano: QuirofanoConCirujanos;
        x: number;
        y: number;
    }
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        if (contextMenu) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [contextMenu]);

    const handleCardClick = (e: React.MouseEvent, q: QuirofanoConCirujanos) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setContextMenu({ quirofano: q, x: rect.left, y: rect.bottom + 4 });
    };

    const handleMenuEditar = () => {
        if (contextMenu && onEditQuirofano) {
            onEditQuirofano(contextMenu.quirofano);
        }
        setContextMenu(null);
    };

    const handleMenuVerParte = () => {
        if (contextMenu) {
            window.open(`/programacion/parte/${contextMenu.quirofano.id_quirofano}`, '_blank');
        }
        setContextMenu(null);
    };

    // Funciones de navegación (Mes a Mes)
    const handlePrev = () => {
        if (viewMode === 'mes') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (viewMode === 'semana') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
        }
    };

    const handleNext = () => {
        if (viewMode === 'mes') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (viewMode === 'semana') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Helper de fechas
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 Lunes .. 6 Domingo
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    // Nombres para mostrar
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Construir las cuadrículas basadas en la vista
    const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];

    if (viewMode === 'mes') {
        const daysInMonth = getDaysInMonth(year, month);
        const startingDay = getFirstDayOfMonth(year, month);
        const daysInPrevMonth = getDaysInMonth(year, month - 1);

        // Días del mes anterior
        for (let i = 0; i < startingDay; i++) {
            calendarCells.push({
                date: new Date(year, month - 1, daysInPrevMonth - startingDay + i + 1),
                isCurrentMonth: false,
            });
        }

        // Días del mes actual
        for (let i = 1; i <= daysInMonth; i++) {
            calendarCells.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Rellenar resto de la semana (hasta múltiplo de 7)
        const remainingCells = 7 - (calendarCells.length % 7);
        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                calendarCells.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false,
                });
            }
        }
    } else if (viewMode === 'semana') {
        const currentDayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            calendarCells.push({ date, isCurrentMonth: date.getMonth() === month });
        }
    } else if (viewMode === 'dia') {
        calendarCells.push({ date: currentDate, isCurrentMonth: true });
    }

    // Comprobar si un día es hoy
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };


    // Agrupar turnos en el día
    const getQuirofanosForDate = (date: Date) => {
        // Corrección de bug de zona horaria al convertir a ISOString
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return agendaData.filter(q => q.fecha === dateStr);
    };

    const getColorByTurno = (turno: string) => {
        switch (turno) {
            case 'Mañana': return { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' }; // Indigo
            case 'Tarde': return { bg: '#FEF3C7', border: '#FDE047', text: '#A16207' }; // Amber
            case 'Continuidad asistencial': return { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE' }; // Purple
            default: return { bg: 'var(--color-primary-surface)', border: 'var(--color-primary-light)', text: 'var(--color-primary-dark)' };
        }
    };

    // Label para el header de navegación
    const getNavLabel = () => {
        if (viewMode === 'mes') return `${monthNames[month]} ${year}`;
        if (viewMode === 'dia') return `${currentDate.getDate()} ${monthNames[month]} ${year}`;

        // Semana
        const start = calendarCells[0].date;
        const end = calendarCells[calendarCells.length - 1].date;
        return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${year}`;
    };

    return (
        <div className={styles.calendarGridWrapper}>
            {/* Controles de calendario interno */}
            <div className={styles.controls} style={{ borderRadius: '0', boxShadow: 'none', borderBottom: '1px solid var(--color-border)' }}>
                <div className={styles.viewGroup}>
                    <button className={`${styles.viewButton} ${viewMode === 'mes' ? styles.viewButtonActive : ''}`} onClick={() => setViewMode('mes')}>Mes</button>
                    <button className={`${styles.viewButton} ${viewMode === 'semana' ? styles.viewButtonActive : ''}`} onClick={() => setViewMode('semana')}>Semana</button>
                    <button className={`${styles.viewButton} ${viewMode === 'dia' ? styles.viewButtonActive : ''}`} onClick={() => setViewMode('dia')}>Día</button>
                </div>

                <div className={styles.navGroup}>
                    <button className={styles.btnIcon} onClick={handlePrev}>&lt;</button>
                    <span className={styles.currentDate}>{getNavLabel()}</span>
                    <button className={styles.btnIcon} onClick={handleNext}>&gt;</button>
                </div>

                <button className={styles.btnSecondary} onClick={handleToday} style={{ padding: '4px 12px', fontSize: 'var(--font-size-sm)' }}>
                    Hoy
                </button>
            </div>

            {/* Contenedor Grid principal para que cabeceras y días compartan el mismo ancho de columna */}
            <div className={styles.calendarTable} style={{ display: viewMode === 'dia' ? 'flex' : 'grid', gridTemplateColumns: viewMode === 'dia' ? '1fr' : 'repeat(7, 1fr)', flexDirection: 'column' }}>
                {/* Cabecera L-D (Sólo para mes y semana) */}
                {viewMode !== 'dia' && (
                    <div className={styles.calendarHeaderRow}>
                        {dayNames.map(day => (
                            <div key={day} className={styles.calendarHeaderCell}>{day}</div>
                        ))}
                    </div>
                )}

                {/* Grid del mes */}
                <div className={styles.calendarBody} style={{
                    display: viewMode === 'dia' ? 'flex' : 'contents',
                    flexDirection: viewMode === 'dia' ? 'column' : 'unset'
                }}>
                    {Array.from({ length: Math.ceil(calendarCells.length / (viewMode === 'dia' ? 1 : 7)) }).map((_, weekIndex) => (
                        <div key={weekIndex} className={styles.calendarWeekRow} style={{ flex: 1 }}>
                            {calendarCells.slice(weekIndex * (viewMode === 'dia' ? 1 : 7), (weekIndex + 1) * (viewMode === 'dia' ? 1 : 7)).map((cell, dayIndex) => {
                                const qs = getQuirofanosForDate(cell.date);
                                return (
                                    <div key={dayIndex} className={styles.calendarDayCell} style={{ backgroundColor: !cell.isCurrentMonth ? 'var(--color-bg)' : 'transparent', flex: 1, minHeight: viewMode === 'mes' ? '120px' : '400px' }}>
                                        <div className={`${styles.dayNumber} ${isToday(cell.date) ? styles.dayNumberToday : ''} ${!cell.isCurrentMonth ? styles.dayNumberOtherMonth : ''}`}>
                                            {viewMode === 'dia' ? `${dayNames[cell.date.getDay() === 0 ? 6 : cell.date.getDay() - 1]} ${cell.date.getDate()}` : cell.date.getDate()}
                                        </div>

                                        {/* Render Quirófanos en este día */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {qs.map(q => {
                                                const colors = getColorByTurno(q.turno);
                                                const cardBg = q.completado ? 'rgba(16, 185, 129, 0.1)' : colors.bg;
                                                const cardBorder = q.completado ? 'rgba(16, 185, 129, 0.4)' : colors.border;

                                                return (
                                                    <div
                                                        key={q.id_quirofano}
                                                        className={styles.quirofanoCard}
                                                        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                                                        onClick={(e) => handleCardClick(e, q)}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <div className={styles.cardHeader} style={{ color: colors.text }}>
                                                            <span className={styles.cardTitle}>
                                                                {q.completado && <span title="Quirófano Completado" style={{ marginRight: '4px', color: '#10B981', fontWeight: 'bold' }}>✓</span>}
                                                                {q.email_enviado && (
                                                                    <span title={`Email enviado el ${q.f_email_enviado ? new Date(q.f_email_enviado).toLocaleDateString('es-ES') : ''}`} style={{ marginRight: '4px', cursor: 'help' }}>
                                                                        ✉️
                                                                    </span>
                                                                )}
                                                                {q.tipo_quirofano || 'IQ'}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', flexShrink: 0 }}>
                                                                <span className={styles.turnoBadge} style={{ color: colors.text }}>
                                                                    {q.turno === 'Continuidad asistencial' ? 'Cont.' : q.turno}
                                                                </span>
                                                                <button
                                                                    className={styles.btnDeleteIcon}
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteQuirofano(q.id_quirofano, q.fecha); }}
                                                                    title="Eliminar sesión"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className={styles.cirujanosList}>
                                                            {q.quirofano_cirujano?.map((rel, idx) => (
                                                                <div key={idx} className={styles.cirujanoItem}>
                                                                    • {rel.cirujanos.apellido1} {rel.cirujanos.apellido2 ? rel.cirujanos.apellido2.charAt(0) + '.' : ''}, {rel.cirujanos.nombre.charAt(0)}.
                                                                </div>
                                                            ))}
                                                            {(!q.quirofano_cirujano || q.quirofano_cirujano.length === 0) && (
                                                                <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin facultativos</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Menú contextual de quirófano */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className={styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button className={styles.contextMenuItem} onClick={handleMenuEditar}>
                        ✏️ Editar
                    </button>
                    <button className={styles.contextMenuItem} onClick={handleMenuVerParte}>
                        🖨️ Ver parte
                    </button>
                </div>
            )}
        </div>
    );
}
