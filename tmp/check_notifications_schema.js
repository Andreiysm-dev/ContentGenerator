import db from '../backend/database/db.js';

async function checkSchema() {
    try {
        const { data, error } = await db.from('notifications').select('*').limit(1);
        const fs = await import('fs');
        if (error) {
            fs.writeFileSync('./tmp/schema_check.txt', 'Error fetching notifications: ' + JSON.stringify(error));
        } else {
            fs.writeFileSync('./tmp/schema_check.txt', JSON.stringify(Object.keys(data[0] || {})));
        }
    } catch (err) {
        console.error('Schema check failed:', err);
    }
}

checkSchema();
