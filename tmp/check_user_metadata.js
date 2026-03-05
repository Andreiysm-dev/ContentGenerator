import db from '../backend/database/db.js';

async function checkMetadata() {
    try {
        const result = await db.auth.admin.listUsers();
        if (result.error) {
            console.error('Error fetching users:', result.error);
        } else if (result.data && result.data.users) {
            console.log('Sample user metadata:', JSON.stringify(result.data.users.slice(0, 2).map(u => ({ id: u.id, metadata: u.user_metadata })), null, 2));
        } else {
            console.log('No users found.');
        }
    } catch (err) {
        console.error('Metadata check failed:', err);
    }
}

checkMetadata();
