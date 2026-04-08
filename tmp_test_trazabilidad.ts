import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Need to define `window` for `crypto.subtle` wrapper if WebCrypto isn't globally available.
// In Node 20+, `crypto` and `crypto.subtle` are available globally under `crypto`
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import { trazabilidadService } from './src/services/trazabilidadService';

async function run() {
    try {
        console.log('Buscando paciente por RDQ "1"...');
        const pacientes = await trazabilidadService.buscarPacientes('1');
        
        if (pacientes.length === 0) {
            console.log('No se encontraron pacientes tranzables con ese identificador.');
        } else {
            console.log(`Pacientes encontrados: ${pacientes.length}`);
            console.log('Datos descifrados (ejemplo primero):', {
                rdq: pacientes[0].rdq,
                paciente: pacientes[0].paciente_encrypted,
                nhc: pacientes[0].nhc_encrypted,
            });

            console.log('\nObteniendo viaje completo para NHC Blind Index:', pacientes[0].nhc_blind_index);
            const viaje = await trazabilidadService.getViajePorNHC(pacientes[0].nhc_blind_index);
            console.log(JSON.stringify(viaje, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

run();
