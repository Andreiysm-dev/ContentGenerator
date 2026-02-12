
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        if (!res.ok) {
            console.error('Error listing models:', JSON.stringify(data, null, 2));
            return;
        }

        const models = data.models || [];

        const imagenModels = models.filter(m => m.name.toLowerCase().includes('imagen'));
        console.log('IMAGEN MODELS:');
        if (imagenModels.length === 0) console.log('  None found');
        imagenModels.forEach(m => console.log(`  ${m.name}`));

        const gemini2Models = models.filter(m => m.name.includes('gemini-2.0'));
        console.log('GEMINI 2.0 MODELS:');
        if (gemini2Models.length === 0) console.log('  None found');
        gemini2Models.forEach(m => console.log(`  ${m.name}`));

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModels();
