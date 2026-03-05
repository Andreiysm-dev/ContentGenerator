import db from '../backend/database/db.js';
import { sendNotificationSummary } from '../backend/services/emailService.js';

async function testEmail() {
    try {
        console.log('--- Email Integration Test ---');

        // 1. Get a sample user to send to (or use a hardcoded email for testing)
        const { data: { users }, error: userError } = await db.auth.admin.listUsers();
        if (userError || !users || users.length === 0) {
            console.error('Could not find any users to test with.');
            return;
        }

        const testUser = users[0];
        console.log(`Sending test email to: ${testUser.email}`);

        // 2. Create sample notification data
        const sampleNotifications = [
            {
                message: '"Summer Campaign 2024" moved to Ready for Approval',
                triggered_by_name: 'AI Content Assistant',
                company_name: 'Startuplab'
            },
            {
                message: '"New Product Launch" moved to Ready for Approval',
                triggered_by_name: 'John Doe',
                company_name: 'Startuplab'
            }
        ];

        // 3. Trigger the email service
        await sendNotificationSummary({
            userEmail: testUser.email,
            userName: testUser.user_metadata?.full_name || 'Test User',
            notifications: sampleNotifications,
            companyName: 'Startuplab',
            companyId: 'test-id'
        });

        console.log('--- Test Completed Successfully ---');
        console.log('Check your inbox (and spam folder) for the test email.');

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testEmail();
