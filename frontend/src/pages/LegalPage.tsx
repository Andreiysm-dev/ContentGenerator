
import React from 'react';

interface LegalPageProps {
    type: 'privacy' | 'terms' | 'deletion';
}

export function LegalPage({ type }: LegalPageProps) {
    const content = {
        privacy: {
            title: 'Privacy Policy',
            lastUpdated: 'February 17, 2026',
            body: `
                We take your privacy seriously. This policy describes how Moonshot Content Generator (the "App") handles your data.
                
                1. Data Collection: We collect information you provide through the Meta login flow, including your name and profile picture.
                2. Data Usage: We use your data exclusively to enable social media posting and analytics tracking for your Facebook Pages and LinkedIn accounts.
                3. Data Storage: Your session data and social media tokens are stored securely in our database.
                4. Third-Party Sharing: We do not sell your personal data. Data is shared with Meta (Facebook/Instagram) and LinkedIn solely to fulfill the App's core functionality.
            `
        },
        terms: {
            title: 'Terms of Service',
            lastUpdated: 'February 17, 2026',
            body: `
                By using Moonshot Content Generator, you agree to these terms.
                
                1. Use of Service: You must use the App in compliance with all applicable laws and social media platform policies.
                2. Responsibility: You are responsible for the content you publish using our tools.
                3. Limitation of Liability: We provide this tool "as is" and are not liable for any issues arising from your use of social media platforms.
            `
        },
        deletion: {
            title: 'Data Deletion Instructions',
            lastUpdated: 'February 17, 2026',
            body: `
                To delete your account or any data associated with it:
                
                1. Go to the Settings > Profile section in the App and click "Delete Account".
                2. Alternatively, you can remove the "Moonshot Content Generator" app from your Facebook App Settings (Settings & Privacy > Apps and Websites).
                3. If you'd like us to manually remove your data, please contact us at andreialexander15@protonmail.com with the subject "Data Deletion Request".
            `
        }
    };

    const active = content[type];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 sm:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            M
                        </div>
                        <h1 className="text-2xl font-bold text-brand-dark">Moonshot Content Generator</h1>
                    </div>

                    <h2 className="text-3xl font-extrabold text-[#3fa9f5] mb-2">{active.title}</h2>
                    <p className="text-sm text-slate-500 mb-8">Last Updated: {active.lastUpdated}</p>

                    <div className="prose prose-slate max-w-none text-brand-dark/80 whitespace-pre-wrap leading-relaxed">
                        {active.body}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <p className="text-sm text-slate-400">
                            &copy; 2026 Moonshot Content Generator. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
