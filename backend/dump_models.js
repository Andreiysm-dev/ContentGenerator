
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        if (!res.ok) {
            console.error('Error listing models:', JSON.stringify(data, null, 2));
            return;
        }

        const models = data.models || [];
        fs.writeFileSync('backend/models_list.json', JSON.stringify(models, null, 2));
        console.log(`Saved ${models.length} models to backend/models_list.json`);

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModels();
