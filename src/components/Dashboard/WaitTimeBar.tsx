/**
 * WaitTimeBar — Distribución por Tramos de Espera
 *
 * Bar chart con rangos de días (0-30, 31-90, 91-180, >180).
 *
 * Wrapper sobre Recharts BarChart.
 */

'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import styles from './Dashboard.module.css';
import type { TramoEspera } from '@/lib/dashboard/dashboard-data';

interface WaitTimeBarProps {
    data: TramoEspera[];
}

const BAR_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

export function WaitTimeBar({ data }: WaitTimeBarProps) {
    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Tramos de Espera</h3>
            <p className={styles.chartSubtitle}>Distribución por días en lista</p>
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="rango"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            formatter={(value) => [`${Number(value)} pacientes`, 'Cantidad']}
                        />
                        <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={`bar-${index}`}
                                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
