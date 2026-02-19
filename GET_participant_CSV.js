const fs = require('fs');

// ================= CONFIG =================
const BASE_URL = "https://test.openspecimen.org/rest/ng";
const USERNAME = "daren";
const PASSWORD = "Admin@1234";
const DOMAIN = "openspecimen";
const CP_ID = 2;
// ==========================================

async function listParticipantsInCP() {
    try {
        // 1️⃣ LOGIN
        console.log("Logging in...");

        const loginResponse = await fetch(`${BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
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

        // 2️⃣ FETCH ALL PARTICIPANTS WITH PAGINATION
        console.log(`\nFetching participants for CP ID: ${CP_ID}...\n`);

        let startAt = 0;
        const maxResults = 100; // Set to null to fetch all records without pagination
        let allRegistrations = [];

        while (true) { // breaks when no more records are returned 
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
                        startAt,
                        maxResults 
                    })
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Fetch failed: ${response.status} - ${errorBody}`);
            }

            const registrations = await response.json();

            if (!registrations || registrations.length === 0) {
                break;
            }

            allRegistrations = allRegistrations.concat(registrations);
            startAt += maxResults;
        }

        if (allRegistrations.length === 0) {
            console.log("No participants found in this CP.");
            return;
        }

        console.log(`Total Participants Found: ${allRegistrations.length}\n`);

        // 3️⃣ PREPARE CSV
        const header = [
            "Participant ID",
            "PPID",
            "First Name",
            "Last Name",
            "Gender",
            "Birth Date",
            "Registration Date"
        ];

        const rows = allRegistrations.map(reg => {
            const p = reg.participant;
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

        console.log("CSV Export Successful ✅");
        console.log("File created: participants.csv\n");

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

listParticipantsInCP();