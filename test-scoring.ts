import { programacionService } from './src/services/programacionService';
import { db } from './src/lib/supabase/client';

async function test() {
    const { data: all } = await db.raw.from('lista_espera').select('*');
    console.log("Total in waitlist:", all?.length);
    const { data: activos } = await db.raw.from('lista_espera').select('*').eq('estado', 'Activo');
    console.log("Total Activos:", activos?.length);

    if (activos && activos.length > 0) {
        console.log("Sample t_anestesia:", activos[0].t_anestesia);
        console.log("Sample rdo_preanestesia:", activos[0].rdo_preanestesia);
    }

    try {
        const sugerencias = await programacionService.getSugerencias();
        console.log("Sugerencias Grupo A:", sugerencias.grupoA.length);
        console.log("Sugerencias Grupo B:", sugerencias.grupoB.length);
    } catch (e) {
        console.error("Error in getSugerencias:", e);
    }
}
test();
