
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    const imageModels = data.models.filter(m =>
        m.supportedGenerationMethods.includes('predict') ||
        m.supportedGenerationMethods.includes('generateContent')
    ).filter(m => JSON.stringify(m).toLowerCase().includes('image') || JSON.stringify(m).toLowerCase().includes('imagen'));

    console.log(JSON.stringify(imageModels, null, 2));
}
main();
