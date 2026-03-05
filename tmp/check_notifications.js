import db from '../backend/database/db.js';

async function checkNotificationsSchema() {
    try {
        const { data, error } = await db.from('notifications').select('*').limit(1);
        if (error) {
            console.error('Error:', error);
        } else if (data && data.length > 0) {
            console.log('Notifications Columns JSON:', JSON.stringify(Object.keys(data[0])));
        } else {
            console.log('No data found in notifications');
        }
    } catch (err) {
        console.error('Caught error:', err);
    }
}

checkNotificationsSchema();
