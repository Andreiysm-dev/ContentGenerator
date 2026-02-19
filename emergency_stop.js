import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyStop() {
    console.log('EMERGENCY: Marking problematic post as PUBLISHED to stop spam...');
    const { error } = await supabase
        .from('contentCalendar')
        .update({ status: 'PUBLISHED' })
        .eq('contentCalendarId', '908c81d9-6b50-426a-950c-242c92429f8f');

    if (error) {
        console.error('Update error:', error);
    } else {
        console.log('Spam target neutralized.');
    }
}

emergencyStop();
