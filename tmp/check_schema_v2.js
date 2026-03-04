
import db from '../backend/database/db.js';

async function checkSchema() {
    try {
        const { data, error } = await db.rpc('get_table_columns', { table_name: 'contentCalendar' });

        if (error) {
            // Fallback: query a row and check keys
            const { data: row } = await db.from('contentCalendar').select('*').limit(1).single();
            if (row) {
                console.log('Columns:', Object.keys(row).join(', '));
            } else {
                console.log('Table exists but is empty or RPC failed.');
            }
        } else {
            console.log('Columns (RPC):', data);
        }
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
