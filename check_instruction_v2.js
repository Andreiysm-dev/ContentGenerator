import db from './backend/database/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const { data, error } = await db.from('brandKB').select('systemInstruction, companyId');
    if (error) {
        console.error('Error fetching brandKB:', error);
        process.exit(1);
    }
    if (!data || data.length === 0) {
        console.log('No brandKB entries found.');
    } else {
        data.forEach((row, i) => {
            console.log(`--- Row ${i} (Company: ${row.companyId}) ---`);
            console.log(row.systemInstruction);
            console.log('------------------------------------------');
        });
    }
    process.exit(0);
}
check();
