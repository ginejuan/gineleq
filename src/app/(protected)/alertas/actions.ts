'use server';

import { getWaitlistData, WaitlistParams, WaitlistRow } from '@/lib/waitlist/waitlist-data';

export async function exportAlertasExcelAccion(filters: WaitlistParams['filters']): Promise<WaitlistRow[]> {
    try {
        const { data } = await getWaitlistData({
            page: 1,
            pageSize: 10000,
            filters,
            sortBy: 't_registro',
            sortDir: 'desc'
        });
        return data;
    } catch (e) {
        console.error(e);
        throw new Error('No se pudo exportar la lista de alertas');
    }
}
