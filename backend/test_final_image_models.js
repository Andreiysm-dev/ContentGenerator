
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testImagen4() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'imagen-4.0-generate-001';

    console.log(`Testing Image Generation with Model: ${model}`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    // Try with integer 1024 which is likely what "1K" refers to in pixel dimensions
    const body = {
        instances: [
            { prompt: "A cute robot eating a pizza, 3d render style" }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            storageUri: undefined, // ensure no bad fields
            // sampleImageSize: 1024 // documentation says "1024" or "2048" usually? Or maybe I should omit it to see default.
            // Error said "must be 1K or 2K". Let's try omitting it first, maybe it defaults to 1K.
        }
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
            console.error('API Error (Default config):', JSON.stringify(data, null, 2));

            // If default fails, try sending specific "1024" as number
            console.log('Retrying with sampleImageSize: 1024...');
            await testWithParam(endpoint, 1024);
            return;
        }

        logSuccess(data);

    } catch (error) {
        console.error('Script Error:', error);
    }
}

async function testWithParam(endpoint, size) {
    const body = {
        instances: [{ prompt: "A robot" }],
        parameters: { sampleCount: 1, aspectRatio: '1:1', sampleImageSize: size }
    };
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) logSuccess(data);
    else console.error('API Error (Size=' + size + '):', JSON.stringify(data, null, 2));
}

function logSuccess(data) {
    const predictions = Array.isArray(data?.predictions) ? data.predictions : [];
    if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        console.log('SUCCESS: Image generated with Imagen 4.0');
        console.log('MimeType:', predictions[0].mimeType);
    } else {
        console.log('FAILURE: No image data in predictions', JSON.stringify(data, null, 2).slice(0, 500));
    }
}

testImagen4();
