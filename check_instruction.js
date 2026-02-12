import db from './backend/database/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const { data, error } = await db.from('brandKB').select('systemInstruction').limit(1);
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
check();
