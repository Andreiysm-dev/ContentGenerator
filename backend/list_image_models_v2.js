
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    if (!data.models) {
        console.log("No models found or error:", data);
        return;
    }

    const relevant = data.models
        .filter(m => m.name.toLowerCase().includes('imagen'))
        .map(m => ({
            name: m.name,
            description: m.description,
            methods: m.supportedGenerationMethods
        }));

    console.log("--- RELEVANT MODELS ---");
    console.log(relevant);
}
main();
