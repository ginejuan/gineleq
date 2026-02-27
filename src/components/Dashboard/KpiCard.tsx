/**
 * KpiCard — Tarjeta de indicador clave
 *
 * Componente reutilizable para mostrar un KPI con icono,
 * valor, etiqueta y subtítulo opcional.
 *
 * Principio: Componentización recursiva (>1 uso = componente).
 */

import styles from './Dashboard.module.css';

interface KpiCardProps {
    icon: string;
    label: string;
    value: number | string;
    subtitle?: string;
    accent?: string; // CSS color override
    scheduledCount?: number; // Pacientes con f_prev_intervencion
}

export function KpiCard({ icon, label, value, subtitle, accent, scheduledCount }: KpiCardProps) {
    return (
        <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>{icon}</div>
            <div className={styles.kpiBody}>
                <span
                    className={styles.kpiValue}
                    style={accent ? { color: accent } : undefined}
                >
                    {value}
                </span>
                <span className={styles.kpiLabel}>{label}</span>
                {subtitle && (
                    <span className={styles.kpiSubtitle}>{subtitle}</span>
                )}
                {scheduledCount !== undefined && scheduledCount > 0 && (
                    <span className={styles.kpiScheduled}>
                        📅 {scheduledCount} con fecha prevista
                    </span>
                )}
            </div>
        </div>
    );
}
