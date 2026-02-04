const https = require('https');

const url = 'https://nyc.cloud.appwrite.io/v1/health';

console.log(`Testing connection to: ${url}`);

const req = https.get(url, (res) => {
    console.log(`StatusCode: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
        console.log('\n\nConnection Successful!');
    });
});

req.on('error', (e) => {
    console.error('Connection Failed:', e);
});
