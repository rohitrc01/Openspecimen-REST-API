const fs = require('fs');

// ================= CONFIG =================
const BASE_URL = "https://test.openspecimen.org/rest/ng";
const USERNAME = "";
const PASSWORD = "";
const DOMAIN = "openspecimen";
const CP_ID = 2;
// ==========================================

async function listParticipantsInCP() {
    try {
        // 1️⃣ LOGIN
        console.log("Logging in...");
        const loginResponse = await fetch(`${BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                loginName: USERNAME,
                password: PASSWORD,
                domainName: DOMAIN
            })
        });

        if (!loginResponse.ok) {
            const errorBody = await loginResponse.text();
            throw new Error(`Login failed: ${loginResponse.status} - ${errorBody}`);
        }
        const { token } = await loginResponse.json();
        console.log("Login Successful ✅");

        // 2️⃣ FETCH PARTICIPANTS
        console.log(`\nFetching participants for CP ID: ${CP_ID}...`);

        let startAt = 0;
        const maxResults = null; // Can be 100 or null
        let allRegistrations = [];
        let pageCount = 0;

        while (true) {
            pageCount++;
            console.log(`Request ${pageCount}: Fetching from index ${startAt}...`);

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
                        maxResults: maxResults 
                    })
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Fetch failed: ${response.status} - ${errorBody}`);
            }
            

            const registrations = await response.json();

            // Break if no data is returned
            if (!registrations || registrations.length === 0) break;
            console.log(registrations)
            allRegistrations = allRegistrations.concat(registrations);
            console.log(`Received ${registrations.length} records.`);

            // --- OPTIMIZED EXIT CONDITIONS ---
            
            // 1. If maxResults is null, the server gave us everything. Stop.
            if (maxResults === null) {
                break;
            }

            // 2. If we received fewer records than we asked for, we've reached the end.
            if (registrations.length < maxResults) {
                break;
            }

            // 3. Increment startAt only if maxResults is a valid number
            startAt += maxResults;
        }

        console.log(`\nTotal Participants Collected: ${allRegistrations.length}`);

        // 3️⃣ PREPARE CSV
        const header = ["Participant ID", "PPID", "First Name", "Last Name", "Gender", "Birth Date", "Registration Date"];
        const rows = allRegistrations.map(reg => {
            const p = reg.participant || {};
            return [
                p.id || "",
                reg.ppid || "",
                p.firstName || "",
                p.lastName || "",
                p.gender || "",
                p.birthDate || "",
                reg.registrationDate || ""
            ].join(",");
        });

        const csvContent = [header.join(","), ...rows].join("\n");
        fs.writeFileSync("participants.csv", csvContent);

        console.log("CSV Export Successful ✅\nFile created: participants.csv\n");

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

listParticipantsInCP();



// OUTPUT 
Logging in...
Login Successful ✅

Fetching participants for CP ID: 2...

Total Participants Found: 68

CSV Export Successful ✅
File created: participants.csv
