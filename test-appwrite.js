const { Client, Account, Databases } = require('node-appwrite');

const endpoint = 'https://nyc.cloud.appwrite.io/v1';
const projectId = '69749cdc001455bc95e6';
// We will read the key from the environment variable passed when running the script
const key = process.env.NEXT_APPWRITE_KEY;

if (!key) {
    console.error('Error: NEXT_APPWRITE_KEY environment variable is missing.');
    process.exit(1);
}

console.log('Testing Appwrite Connection...');
console.log(`Endpoint: ${endpoint}`);
console.log(`Project ID: ${projectId}`);
console.log(`Key Length: ${key.length}`);

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(key);

const account = new Account(client);

async function testConnection() {
    try {
        console.log('Attempting to list documents (as a connectivity test)...');
        // We can't easily list users without scope, but we can try a simple call that requires auth
        // Or just try to get the account if we had a session, but we are admin.
        // Let's try to get the project info or just handle the error.

        // Actually, listing documents from a collection we know exists is a good test.
        // From .env: APPWRITE_DATABASE_ID=6974a414001973b133fd
        // APPWRITE_USER_COLLECTION_ID=6974a788001e8555c784

        const databases = new Databases(client);
        const dbId = '6974a414001973b133fd';
        const collId = '6974a788001e8555c784';

        const docs = await databases.listDocuments(dbId, collId);
        console.log('Success! Connection established.');
        console.log(`Found ${docs.total} documents.`);
    } catch (error) {
        console.error('Connection Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) console.error('Error Cause:', error.cause);
        console.error('Full Error:', error);
    }
}

testConnection();
