const fs = require('fs');

// ================= CONFIG =================
const BASE_URL = "https://test.openspecimen.org/rest/ng";
const USERNAME = "";
const PASSWORD = "";
const DOMAIN = "openspecimen";
const CP_ID = 2;
const PAGE_SIZE = 100; // Keep 100 for performance
// ==========================================


// 🔹 Helper: Flatten nested objects
function flattenObject(obj, parent = '', res = {}) {
    for (let key in obj) {
        const propName = parent ? `${parent}.${key}` : key;

        if (Array.isArray(obj[key])) {
            res[propName] = JSON.stringify(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            flattenObject(obj[key], propName, res);
        } else {
            res[propName] = obj[key];
        }
    }
    return res;
}


// 🔹 Login function
async function login() {
    const response = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            loginName: USERNAME,
            password: PASSWORD,
            domainName: DOMAIN
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Login failed: ${error}`);
    }

    const { token } = await response.json();
    return token;
}


// 🔹 Get all registration IDs (Paged)
async function getAllRegistrations(token) {
    let startAt = 0;
    let allRegs = [];

    while (true) {
        const response = await fetch(
            `${BASE_URL}/collection-protocol-registrations/list`,
            {
                method: 'POST',
                headers: {
                    'X-OS-API-TOKEN': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cpId: CP_ID,
                    startAt: startAt,
                    maxResults: PAGE_SIZE
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Fetch list failed: ${error}`);
        }

        const regs = await response.json();
        if (!regs || regs.length === 0) break;

        allRegs = allRegs.concat(regs);

        if (regs.length < PAGE_SIZE) break;
        startAt += PAGE_SIZE;
    }

    return allRegs;
}


// 🔹 Get full registration detail
async function getRegistrationDetail(token, regId) {
    const response = await fetch(
        `${BASE_URL}/collection-protocol-registrations/${regId}`,
        {
            headers: {
                'X-OS-API-TOKEN': token
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to fetch detail for ID ${regId}: ${error}`);
        return null;
    }

    return await response.json();
}


// 🔹 Main Function
async function exportParticipants() {
    try {
        console.log("🔐 Logging in...");
        const token = await login();
        console.log("✅ Login successful");

        console.log("\n📥 Fetching registration list...");
        const registrations = await getAllRegistrations(token);
        console.log(`Total registrations found: ${registrations.length}`);

        let detailedData = [];

        for (let i = 0; i < registrations.length; i++) {
            const reg = registrations[i];
            console.log(`Fetching detail ${i + 1}/${registrations.length} (ID: ${reg.id})`);

            const detail = await getRegistrationDetail(token, reg.id);
            if (detail) {
                detailedData.push(flattenObject(detail));
            }
        }

        if (detailedData.length === 0) {
            console.log("No data found.");
            return;
        }

        // Collect all unique headers dynamically
        let headers = new Set();
        detailedData.forEach(row => {
            Object.keys(row).forEach(key => headers.add(key));
        });

        headers = Array.from(headers);

        // Create CSV rows
        const rows = detailedData.map(row => {
            return headers.map(h => {
                let value = row[h] ?? "";
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        fs.writeFileSync("participants_full_export.csv", csvContent);

        console.log("\n🎉 Export Successful!");
        console.log("File created: participants_full_export.csv");

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

exportParticipants();
