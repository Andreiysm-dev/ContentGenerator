import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { supabase } from './database/db.js';

async function restoreAdmin() {
    const { data: users, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    for (const u of users) {
        if (u.role && u.role !== 'ADMIN') {
            console.log('Restoring ADMIN to', u.id, 'from', u.role);
            await supabase.from('profiles').update({ role: 'ADMIN' }).eq('id', u.id);
            console.log('Done restoring');
        }
    }
}

restoreAdmin();
