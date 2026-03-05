import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';

dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Sends a single transactional email via Brevo.
 */
export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('[EmailService] Skipping email - BREVO_API_KEY not found.');
        return;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME || 'Content Board',
        email: process.env.BREVO_SENDER_EMAIL || 'support@startuplab.com'
    };
    sendSmtpEmail.to = [{ email: to }];
    if (textContent) sendSmtpEmail.textContent = textContent;

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EmailService] Email sent successfully:', data.messageId);
        return data;
    } catch (error) {
        console.error('[EmailService] Error sending email:', error.response?.body || error.message);
        throw error;
    }
};

/**
 * Generates a summary email for pending notifications.
 */
export const sendNotificationSummary = async ({ userEmail, userName, notifications, companyName, companyId }) => {
    if (!notifications || notifications.length === 0) return;

    const count = notifications.length;
    const subject = `[Action Required] ${count} new items on your ${companyName} board`;

    let itemsHtml = notifications.map(n => `
        <li style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; list-style: none; border-left: 4px solid #4f46e5;">
            <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${n.message}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Triggered by ${n.triggered_by_name || 'Team member'}</div>
        </li>
    `).join('');

    const boardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/company/${companyId}/calendar`;

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <h2 style="color: #1e293b;">Hi ${userName || 'there'},</h2>
            <p>You have <strong>${count}</strong> new updates on the <strong>${companyName}</strong> board that require your attention:</p>
            
            <ul style="padding: 0;">
                ${itemsHtml}
            </ul>

            <div style="margin-top: 32px; text-align: center;">
                <a href="${boardUrl}" style="background-color: #4f46e5; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    View Content Board
                </a>
            </div>

            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                You received this because you enabled email notifications for specific columns in ${companyName}.
            </p>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject,
        htmlContent
    });
};
