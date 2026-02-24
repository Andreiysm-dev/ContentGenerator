
import db from './backend/database/db.js';

async function verifySchema() {
    try {
        const { data: companyData, error: companyError } = await db.from('company').select('*').limit(1);
        if (companyError) {
            console.error('Company table error:', companyError);
        } else {
            console.log('Company table columns:', Object.keys(companyData[0] || {}));
        }

        // Attempting a sample update to see what fails
        console.log('Attempting sample update to custom_roles...');
        const { error: updateError } = await db.from('company').update({ custom_roles: [] }).eq('companyId', 'invalid-id-just-to-test-column');
        if (updateError) {
            console.error('Update custom_roles failed (could mean column missing):', updateError);
        } else {
            console.log('Update custom_roles check passed (column probably exists).');
        }
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        process.exit();
    }
}

verifySchema();
