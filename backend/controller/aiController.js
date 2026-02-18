
export const generateContent = async (req, res) => {
    try {
        const { prompt, noStream } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Missing OpenAI API Key" });
        }

        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API Error:", errorText);
            return res.status(response.status).json({ error: "OpenAI API Error", details: errorText });
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

        res.json({ content });

    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: "Failed to generate content" });
    }
};
