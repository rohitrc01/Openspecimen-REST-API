const axios = require('axios');

// --- Configuration ---
const CONFIG = {
    baseUrl: '',
    username: '',
    password: '',
    domain: 'openspecimen'
};

async function runOpenSpecimenTasks() {
    try {
        // 1. LOGIN
        console.log('Logging in...');
        const loginResponse = await axios.post(`${CONFIG.baseUrl}/sessions`, {
            loginName: CONFIG.username,
            password: CONFIG.password,
            domainName: CONFIG.domain
        });

        const { token, firstName, lastName, loginName, id } = loginResponse.data;

        // Create an Axios instance with the token pre-configured in headers
        const osClient = axios.create({
            baseURL: CONFIG.baseUrl,
            headers: { 'X-OS-API-TOKEN': token }
        });

        console.log('--- User Details ---');
        console.log(`Full Name:  ${firstName} ${lastName}`);
        console.log(`Login Name: ${loginName}`);
        console.log(`User ID:    ${id}`);
        console.log('--------------------\n');

        // 2. LOGOUT
        // In OpenSpecimen, deleting the session resource logs you out
        console.log('Logging out...');
        await osClient.delete('/sessions');
        console.log('Logout successful. Token invalidated.');

    } catch (error) {
        if (error.response) {
            console.error(`API Error (${error.response.status}):`, error.response.data);
        } else {
            console.error('Connection Error:', error.message);
        }
    }
}

runOpenSpecimenTasks();