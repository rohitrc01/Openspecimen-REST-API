const BASE_URL = "https://your-openspecimen-url.com/openspecimen/rest/ng";
const USERNAME = "";
const PASSWORD = "";
const DOMAIN   = "";

async function openspecimenDemo() {
    try {
        // 1. LOGIN
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
            const errorText = await loginResponse.text();
            throw new Error(`Login failed: ${errorText}`);
        }

        const authData = await loginResponse.json();
        const token = authData.token;

        console.log("--- Login Successful ---");
        console.log(`User Name:  ${authData.firstName} ${authData.lastName}`);
        console.log(`Login Name: ${authData.loginName}`);
        console.log(`Token:      ${token.substring(0, 8)}...`);

        // 2. LOGOUT
        const logoutResponse = await fetch(`${BASE_URL}/sessions`, {
            method: 'DELETE',
            headers: {
                'X-OS-API-TOKEN': token,
                'Content-Type': 'application/json'
            }
        });

        if (logoutResponse.ok) {
            console.log("\n--- Logout Successful ---");
        }
    } catch (err) {
        console.error(err.message);
    }
}

openspecimenDemo();



// OUTPUT 

--- Login Successful ---
User Name:  Rohit Chaudhari
Login Name: *******@gmail.com
Token:      MGNlZjZl...****

--- Logout Successful ---


