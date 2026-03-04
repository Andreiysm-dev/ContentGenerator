
import db from '../backend/database/db.js';

async function checkSchema() {
    try {
        const { data, error } = await db
            .from('contentCalendar')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
            process.exit(1);
        }

        if (data && data.length > 0) {
            console.log('--- COLUMNS START ---');
            Object.keys(data[0]).forEach(k => console.log(k));
            console.log('--- COLUMNS END ---');
        } else {
            console.log('No rows found in contentCalendar');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
