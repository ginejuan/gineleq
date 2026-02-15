/**
 * DonutChart — Composición de la Lista de Espera
 *
 * Muestra la distribución por categoría: Onco-Mama, Onco-Gine,
 * Garantía, Estándar.
 *
 * Wrapper sobre Recharts PieChart.
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './Dashboard.module.css';
import type { ComposicionSegment } from '@/lib/dashboard/dashboard-data';

interface DonutChartProps {
    data: ComposicionSegment[];
}

export function DonutChart({ data }: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Composición de la Lista</h3>
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={100}
                            paddingAngle={3}
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
                                return [
                                    `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                                    name,
                                ];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={8}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
