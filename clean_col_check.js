
import db from './backend/database/db.js';

async function checkColumns() {
    try {
        const { data, error } = await db.from('company').select('*').limit(1);
        if (error) {
            console.log('COLUMN_CHECK_ERROR:' + JSON.stringify(error));
        } else if (data && data.length > 0) {
            console.log('COLUMN_NAMES:' + JSON.stringify(Object.keys(data[0])));
        } else {
            console.log('NO_DATA_IN_COMPANY_TABLE');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkColumns();
