
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testImagenParam(val) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'imagen-4.0-generate-001';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    console.log(`Testing with sampleImageSize: ${JSON.stringify(val)}`);

    const body = {
        instances: [{ prompt: "A robot" }],
        parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            sampleImageSize: val
        }
    };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            console.log(`FAILED with ${JSON.stringify(val)}: ${data.error?.message}`);
        } else {
            console.log(`SUCCESS with ${JSON.stringify(val)}`);
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

async function runTests() {
    await testImagenParam("1024");
    await testImagenParam("1K"); // Try literal "1K" just in case
    await testImagenParam(1024); // Re-verify integer fail
}

runTests();
