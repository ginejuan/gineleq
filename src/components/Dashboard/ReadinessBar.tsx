/**
 * ReadinessBar — Estado de Preparación Quirúrgica
 *
 * Progress bar visual: pacientes "listas" (Apto + Local/Sin)
 * sobre el censo total activo.
 *
 * Componente puro (sin librería externa).
 */

import styles from './Dashboard.module.css';

interface ReadinessBarProps {
    ready: number;
    total: number;
}

export function ReadinessBar({ ready, total }: ReadinessBarProps) {
    const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Preparación Quirúrgica</h3>
            <p className={styles.chartSubtitle}>
                Pacientes listas para intervención
            </p>
            <div className={styles.readinessContainer}>
                <div className={styles.readinessBarTrack}>
                    <div
                        className={styles.readinessBarFill}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className={styles.readinessLabels}>
                    <span className={styles.readinessValue}>
                        {ready} / {total}
                    </span>
                    <span className={styles.readinessPct}>
                        {pct}%
                    </span>
                </div>
                <p className={styles.readinessCaption}>
                    Incluye: Apto en preanestesia + Cirugía local / Sin anestesia
                </p>
            </div>
        </div>
    );
}
