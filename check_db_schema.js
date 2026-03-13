
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const s = createClient(url, key);

async function run() {
    try {
        const { data: cData } = await s.from('contentCalendar').select('*').limit(1);
        if (cData && cData[0]) {
            console.log('--- contentCalendar columns ---');
            Object.keys(cData[0]).forEach(k => console.log(k));
        }

        const { data: compData } = await s.from('company').select('*').limit(1);
        if (compData && compData[0]) {
            console.log('\n--- company columns ---');
            Object.keys(compData[0]).forEach(k => console.log(k));
        }
    } finally {
        process.exit();
    }
}
run();
