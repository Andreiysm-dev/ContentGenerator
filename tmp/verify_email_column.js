import db from '../backend/database/db.js';

async function updateSchema() {
    try {
        console.log('Checking notifications table...');

        // Check if column exists
        const { data, error } = await db.from('notifications').select('email_notified').limit(1);

        if (error && error.code === '42703') { // Column does not exist
            console.log('Column email_notified missing. You need to run this SQL in Supabase Dashboard:');
            console.log('ALTER TABLE notifications ADD COLUMN email_notified BOOLEAN DEFAULT false;');
        } else if (error) {
            console.error('Database error:', error);
        } else {
            console.log('Column email_notified already exists. Good to go!');
        }
    } catch (err) {
        console.error('Fatal error checking schema:', err);
    }
}

updateSchema();
