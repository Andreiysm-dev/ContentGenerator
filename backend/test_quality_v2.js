
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testQuality(model, val, cleanMarkdown) {
    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    let prompt = "**Establish your Local & Global Presence** with high-end corporate graphics. **Start with VO**";

    if (cleanMarkdown) {
        prompt = prompt.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '');
    }

    console.log(`\n--- Testing ${model} | Size: ${val} | Clean: ${cleanMarkdown} ---`);
    console.log(`Prompt: ${prompt}`);

    const body = {
        instances: [{ prompt }],
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
            console.log(`FAILED: ${data.error?.message}`);
        } else {
            console.log(`SUCCESS! Prediction received.`);
            // Just checking if we got a result
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

async function runTests() {
    // Current setup
    await testQuality('imagen-4.0-generate-001', '1K', false);

    // Clean markdown setup
    await testQuality('imagen-4.0-generate-001', '1K', true);

    // 2K setup
    await testQuality('imagen-4.0-generate-001', '2K', true);

    // Ultra model
    await testQuality('imagen-4.0-ultra-generate-001', '1K', true);
}

runTests();
