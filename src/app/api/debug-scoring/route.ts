import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: all } = await db.raw.from('lista_espera').select('*').limit(50);

        let activosPorQuery = [];
        let activosLocales = [];

        if (all) {
            activosLocales = all.filter(p => p.estado === 'Activo' || p.estado?.toLowerCase() === 'activo');

            const { data: activos } = await db.raw.from('lista_espera').select('*').eq('estado', 'Activo').limit(50);
            activosPorQuery = activos || [];
        }

        return NextResponse.json({
            ok: true,
            totalRowsFound: all?.length || 0,
            activeCountQuery: activosPorQuery.length,
            activeCountLocal: activosLocales.length,
            sample: all?.slice(0, 5).map(p => ({ rdq: p.rdq, estado: p.estado, t_anestesia: p.t_anestesia }))
        });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message });
    }
}
