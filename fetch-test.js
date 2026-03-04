(async () => {
    try {
        const res = await fetch("http://localhost:5000/api/company/7175ee0a-cc99-4117-9ef7-4c7bcd2df9da", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ kanban_settings: { columns: [], automations: [] } })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
})();
