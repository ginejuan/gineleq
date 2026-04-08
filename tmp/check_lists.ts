import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLists() {
    console.log("Checking mailing lists using admin credentials directly...");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("Missing env variables");
    }

    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('listas_distribucion').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found lists:", data.length);
        console.log(data);
    }
}

checkLists().catch(console.error);
