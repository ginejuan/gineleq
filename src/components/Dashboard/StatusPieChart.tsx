/**
 * StatusPieChart — Cumplimiento de Plazos
 *
 * Muestra el estado de cumplimiento (Verde, Naranja, Rojo) para un grupo.
 * Interactivo: muestra % y número absoluto en el tooltip.
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './Dashboard.module.css';
import type { StatusDistribution } from '@/lib/dashboard/dashboard-data';

interface StatusPieChartProps {
    distribution: StatusDistribution;
}

export function StatusPieChart({ distribution }: StatusPieChartProps) {
    const { data, title, description } = distribution;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{title}</h3>
            <p className={styles.chartSubtitle}>{description}</p>
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => {
                                const v = Number(value);
                                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                                return [`${v} pacientes (${pct}%)`, name];
                            }}
                            contentStyle={{
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                fontSize: 'var(--font-size-xs)',
                                paddingTop: 'var(--spacing-md)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
