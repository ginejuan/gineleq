/**
 * OncoGauge — Carga de Trabajo Oncológica
 *
 * Gauge semicircular mostrando el % de oncológicas
 * intervenidas dentro del plazo de 30 días.
 *
 * Componente puro (CSS-only semicircle gauge).
 */

import styles from './Dashboard.module.css';

interface OncoGaugeProps {
    enPlazo: number;
    total: number;
}

export function OncoGauge({ enPlazo, total }: OncoGaugeProps) {
    const pct = total > 0 ? Math.round((enPlazo / total) * 100) : 0;

    // Determine color based on percentage
    const getColor = (p: number): string => {
        if (p >= 80) return '#10B981'; // green
        if (p >= 50) return '#F59E0B'; // amber
        return '#EF4444'; // red
    };

    const color = getColor(pct);
    // semicircle: 180deg rotation = 100%
    const rotation = (pct / 100) * 180;

    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Carga Onco &lt;30 días</h3>
            <p className={styles.chartSubtitle}>
                Oncológicas dentro del plazo
            </p>
            <div className={styles.gaugeWrapper}>
                <div className={styles.gaugeOuter}>
                    <div
                        className={styles.gaugeInner}
                        style={{
                            background: `conic-gradient(
                                ${color} 0deg,
                                ${color} ${rotation}deg,
                                #E2E8F0 ${rotation}deg,
                                #E2E8F0 180deg,
                                transparent 180deg
                            )`,
                        }}
                    />
                    <div className={styles.gaugeMask} />
                    <div className={styles.gaugeCenter}>
                        <span
                            className={styles.gaugeValue}
                            style={{ color }}
                        >
                            {pct}%
                        </span>
                        <span className={styles.gaugeLabel}>
                            {enPlazo}/{total}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
