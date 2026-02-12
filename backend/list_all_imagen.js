
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    const allImagen = data.models.filter(m => m.name.toLowerCase().includes('imagen'));
    console.log(JSON.stringify(allImagen, null, 2));
}
main();
