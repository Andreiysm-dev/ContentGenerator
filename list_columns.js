
import db from './backend/database/db.js';

async function listAllColumns() {
    try {
        const { data, error } = await db.from('company').select('*').limit(1);
        if (error) {
            console.error('Error selecting from company:', error);
            // If select * fails, maybe the table is empty or has issues.
            // Let's try to get schema info via postgrest if possible, or just look at error message.
            if (error.message && error.message.includes('column')) {
                console.log('Select * failed with column error:', error.message);
            }
        }

        if (data && data.length > 0) {
            console.log('Actual columns in company table:', Object.keys(data[0]));
        } else {
            console.log('Company table is empty, trying alternative column check...');
            const { data: cols, error: colError } = await db.rpc('get_table_columns', { table_name: 'company' });
            if (colError) {
                console.log('No RPC for columns, trying a safe select...');
                const { data: safeData, error: safeError } = await db.from('company').select('user_id, companyId').limit(1);
                if (safeError) {
                    console.log('Basic columns missing too?', safeError);
                } else {
                    console.log('Basic columns exist (user_id, companyId).');
                }
            } else {
                console.log('Table columns:', cols);
            }
        }
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

listAllColumns();
