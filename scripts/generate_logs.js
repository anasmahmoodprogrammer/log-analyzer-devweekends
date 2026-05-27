const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../sample_log.txt');
const TOTAL_LINES = 5000;

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const paths = ['/api/users', '/api/login', '/api/dashboard', '/api/users/12', '/health'];
const statuses = ['200', '201', '400', '401', '404', '500'];

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateNormalLine() {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
    const ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const method = randomElement(methods);
    const endpoint = randomElement(paths);
    const status = randomElement(statuses);
    const ms = Math.floor(Math.random() * 500) + 10;
    
    return `${timestamp} ${ip} ${method} ${endpoint} ${status} ${ms}ms`;
}

function generateAnomaly() {
    const type = Math.floor(Math.random() * 6);
    const timestamp = new Date().toISOString();
    
    switch(type) {
        case 0: return `2024/03/15 14:23:01 10.0.0.1 GET /api/old_format 200 45ms`; // Different date
        case 1: return `${Math.floor(Date.now()/1000)} 192.168.1.5 GET /api/unix 200 120`; // Unix epoch, no ms
        case 2: return `${timestamp} 10.0.0.7 POST /api/broken - 0.142s`; // Missing status, seconds
        case 3: return `${timestamp} 192.168.1.42 GET /api/users 200 142ms "Mozilla/5.0 User Agent"`; // Extra fields
        case 4: return `{"timestamp": "${timestamp}", "ip": "10.0.0.1", "msg": "bolted on JSON"}`; // JSON mixed in
        case 5: return `Exception in thread "main" java.lang.NullPointerException\n\tat com.example.App.main(App.java:14)`; // Stack trace
    }
}

const writeStream = fs.createWriteStream(OUTPUT_FILE);

for (let i = 0; i < TOTAL_LINES; i++) {
    const isAnomaly = Math.random() < 0.08; // Roughly 8% anomalies
    const line = isAnomaly ? generateAnomaly() : generateNormalLine();
    writeStream.write(line + '\n');
}

writeStream.end(() => {
    console.log(`Generated ${TOTAL_LINES} lines in ${OUTPUT_FILE}`);
});