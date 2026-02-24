
import db from './backend/database/db.js';

async function checkColumns() {
    try {
        const { data, error } = await db.from('company').select('*').limit(1);
        if (error) {
            console.error('Error selecting from company:', error);
            return;
        }
        if (data && data.length > 0) {
            console.log('Columns in company table:', Object.keys(data[0]));
        } else {
            console.log('No data in company table to check columns.');
            // Try to insert a dummy row or just use a different method if available
        }
    } catch (err) {
        console.error('Check columns failed:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
