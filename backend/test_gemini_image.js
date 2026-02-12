
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testImageGen() {
    const apiKey = process.env.GEMINI_API_KEY;
    // Use the model found in the list
    const model = 'gemini-2.0-flash';

    console.log(`Testing Image Generation with Model: ${model}`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
        generationConfig: {
            responseMimeType: 'image/jpeg',
            responseModalities: ["IMAGE"]
        },
        contents: [
            {
                parts: [{ text: "A cute robot eating a pizza, 3d render style" }]
            }
        ]
    };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('API Error:', JSON.stringify(data, null, 2));
            return;
        }

        console.log('Success with generateContent');
        // Check for inlineData
        const candidates = data.candidates || [];
        const parts = candidates[0]?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData);

        if (imagePart) {
            console.log('Image received!');
            console.log(`MimeType: ${imagePart.inlineData.mimeType}`);
            console.log(`Data length: ${imagePart.inlineData.data.length}`);
        } else {
            console.log('No image inlineData found. Response parts:', JSON.stringify(parts, null, 2));
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

testImageGen();
