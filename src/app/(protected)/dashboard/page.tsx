/**
 * Dashboard — Panel de Control (arquitectura.md §10)
 *
 * Server component. Trae datos del servidor (PII descifrado),
 * computa KPIs y renderiza sub-componentes.
 *
 * Principio: UI es "tonta" (solo muestra datos computados).
 */

import { getDashboardData } from '@/lib/dashboard/dashboard-data';
import { KpiCard } from '@/components/Dashboard/KpiCard';
import { DonutChart } from '@/components/Dashboard/DonutChart';
import { ReadinessBar } from '@/components/Dashboard/ReadinessBar';
import { WaitTimeBar } from '@/components/Dashboard/WaitTimeBar';
import { OncoGauge } from '@/components/Dashboard/OncoGauge';
import { PatientTable } from '@/components/Dashboard/PatientTable';
import pageStyles from '../page.module.css';
import styles from '@/components/Dashboard/Dashboard.module.css';

// Forzar renderizado dinámico (datos cambian con cada importación)
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <>
            <header className={pageStyles.pageHeader}>
                <h1 className={pageStyles.pageTitle}>Dashboard</h1>
                <p className={pageStyles.pageSubtitle}>
                    Panel de control — Visión analítica de la unidad
                </p>
            </header>

            {/* --- KPIs --- */}
            <section className={styles.kpiGrid}>
                <KpiCard
                    icon="🏥"
                    label="Censo Total"
                    value={data.kpis.censoTotal}
                />
                <KpiCard
                    icon="⚡"
                    label="Priorizables"
                    value={data.kpis.priorizables}
                    accent="#8B5CF6"
                />
                <KpiCard
                    icon="⏸️"
                    label="Suspendidas"
                    value={data.kpis.suspendidas}
                    accent="#64748B"
                />
                <KpiCard
                    icon="🎀"
                    label="Onco-Mama"
                    value={data.kpis.oncoMama}
                    accent="#EC4899"
                />
                <KpiCard
                    icon="🔬"
                    label="Onco-Gine"
                    value={data.kpis.oncoGine}
                    accent="#8B5CF6"
                />
                <KpiCard
                    icon="✅"
                    label="Vto. Bueno Anestesia"
                    value={data.kpis.vistoBuenoAnestesia}
                    subtitle={`${data.kpis.pctAnestesiaApto}% de ${data.kpis.requierenAnestesia} que requieren`}
                    accent="#10B981"
                />
                <KpiCard
                    icon="💉"
                    label="Local / Sin Anestesia"
                    value={data.kpis.cirugiaLocalSin}
                    subtitle="Listas sin preanestesia"
                    accent="#0EA5E9"
                />
            </section>

            {/* --- Demora Media --- */}
            <h2 className={styles.sectionTitle}>Tiempos de Demora Media</h2>
            <p className={styles.sectionSubtitle}>
                Promedio de días en lista por segmento patológico
            </p>
            <section className={styles.demoraGrid}>
                <div className={styles.demoraCard}>
                    <span className={styles.demoraValue}>
                        {data.demora.global}
                        <span className={styles.demoraUnit}> días</span>
                    </span>
                    <span className={styles.demoraLabel}>Global</span>
                </div>
                <div className={styles.demoraCard}>
                    <span className={styles.demoraValue}>
                        {data.demora.mama}
                        <span className={styles.demoraUnit}> días</span>
                    </span>
                    <span className={styles.demoraLabel}>Onco-Mama</span>
                </div>
                <div className={styles.demoraCard}>
                    <span className={styles.demoraValue}>
                        {data.demora.gine}
                        <span className={styles.demoraUnit}> días</span>
                    </span>
                    <span className={styles.demoraLabel}>Onco-Gine</span>
                </div>
                <div className={styles.demoraCard}>
                    <span className={styles.demoraValue}>
                        {data.demora.estandar}
                        <span className={styles.demoraUnit}> días</span>
                    </span>
                    <span className={styles.demoraLabel}>Estándar</span>
                </div>
            </section>

            {/* --- Charts --- */}
            <h2 className={styles.sectionTitle}>Análisis Gráfico</h2>
            <section className={styles.chartsGrid}>
                <DonutChart data={data.composicion} />
                <ReadinessBar
                    ready={data.readiness.ready}
                    total={data.readiness.total}
                />
                <WaitTimeBar data={data.tramosEspera} />
                <OncoGauge
                    enPlazo={data.oncoGauge.enPlazo}
                    total={data.oncoGauge.total}
                />
            </section>

            {/* --- Patient Table --- */}
            <PatientTable patients={data.patients} />
        </>
    );
}
