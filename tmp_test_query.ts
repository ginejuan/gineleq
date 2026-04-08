import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await client
        .from('quirofanos')
        .select(`
            id_quirofano,
            fecha,
            tipo_quirofano,
            completado,
            quirofanos_documentos (*)
        `)
        .eq('fecha', '2026-03-30');

    if (error) {
        console.error('Error:', error);
    } else {
        const fs = require('fs');
        fs.writeFileSync('c:\\Antigravity\\gineleq\\tmp_output.json', JSON.stringify(data, null, 2));
    }
}
run();
