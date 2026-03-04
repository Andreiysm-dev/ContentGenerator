
import db from '../backend/database/db.js';

async function checkAuditSchema() {
    try {
        const { data: row } = await db.from('audit_logs').select('*').limit(1).single();
        if (row) {
            console.log('Audit Log Columns:', Object.keys(row).join(', '));
        } else {
            // Try explicit query for columns
            const { data: cols } = await db.rpc('get_table_columns', { table_name: 'audit_logs' });
            console.log('Audit Log Columns (RPC):', cols);
        }
    } catch (e) {
        console.error(e);
    }
}

checkAuditSchema();
