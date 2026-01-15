const fetch = require('node-fetch');

async function testUpdate() {
    const id = 'a4aad4f1-f820-4d44-9532-a290a3cc360f';
    const url = `http://localhost:5000/api/admin/consolidation-points/${id}`;

    console.log("Current status in DB before test...");
    // Note: I can't easily fetch from here without auth headers if it's protected.
    // But wait, the admin session might be required.

    const payload = {
        status: "INACTIVE",
        notes: "Tested by Antigravity at " + new Date().toISOString()
    };

    console.log("Sending PATCH with payload:", payload);

    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // How to get the session cookie? 
                // I'll skip the Auth for now and see if it fails with 401.
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const body = await res.json();
        console.log("Response Body:", JSON.stringify(body, null, 2));
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testUpdate();
