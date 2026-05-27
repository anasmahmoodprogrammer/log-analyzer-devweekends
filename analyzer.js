const fs = require('fs');
const readline = require('readline');

const logFilePath = process.argv[2];

if (!logFilePath) {
    console.error("Usage: node analyzer.js <path_to_log_file>");
    process.exit(1);
}

// Regex to capture the standard shape: Date IP Method Path Status Time
// Groups: 1:Date, 2:IP, 3:Method, 4:Path, 5:Status, 6:Time
const standardLogRegex = /^(\S+(?:\s+\S+)?)\s+(\d{1,3}(?:\.\d{1,3}){3})\s+([A-Z]+)\s+(\/\S*)\s+(\d{3}|-)\s+(\d+(?:\.\d+)?(?:ms|s)?)/;

const stats = {
    totalLines: 0,
    parsedLines: 0,
    malformedLines: 0,
    statusCodes: {},
    endpoints: {} // stores { count, totalTimeMs }
};

const malformedSamples = [];

function normalizeTimeMs(timeStr) {
    if (timeStr.endsWith('ms')) return parseFloat(timeStr.replace('ms', ''));
    if (timeStr.endsWith('s')) return parseFloat(timeStr.replace('s', '')) * 1000;
    return parseFloat(timeStr); 
}

const rl = readline.createInterface({
    input: fs.createReadStream(logFilePath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    stats.totalLines++;
    if (!line.trim()) {
        stats.malformedLines++;
        return;
    }

    const match = line.match(standardLogRegex);

    if (match) {
        stats.parsedLines++;
        const status = match[5];
        const path = match[4];
        const timeStr = match[6];

        // Track Status Codes
        stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;

        // Track Endpoints for latency
        const timeMs = normalizeTimeMs(timeStr);
        if (!stats.endpoints[path]) {
            stats.endpoints[path] = { count: 0, totalTimeMs: 0 };
        }
        stats.endpoints[path].count++;
        stats.endpoints[path].totalTimeMs += timeMs;

    } else {
        stats.malformedLines++;
        if (malformedSamples.length < 5) {
            malformedSamples.push(line);
        }
    }
});

rl.on('close', () => {
    console.log("\n--- Log Analysis Report ---");
    console.log(`Total Lines Evaluated: ${stats.totalLines}`);
    console.log(`Successfully Parsed:   ${stats.parsedLines}`);
    console.log(`Malformed/Skipped:     ${stats.malformedLines} (${((stats.malformedLines / stats.totalLines) * 100).toFixed(2)}%)`);

    console.log("\n--- Status Code Distribution ---");
    for (const [code, count] of Object.entries(stats.statusCodes)) {
        console.log(`HTTP ${code}: ${count}`);
    }

    console.log("\n--- Top 5 Slowest Endpoints (Average Latency) ---");
    const avgLatency = Object.entries(stats.endpoints).map(([path, data]) => {
        return { path, avgMs: data.totalTimeMs / data.count };
    });
    
    avgLatency.sort((a, b) => b.avgMs - a.avgMs);
    avgLatency.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.path} - ${item.avgMs.toFixed(2)}ms`);
    });

    if (stats.malformedLines > 0) {
        console.log("\n--- Anomaly Sample (First 5 Malformed Lines) ---");
        malformedSamples.forEach(sample => console.log(`> ${sample.substring(0, 80)}...`));
    }
    console.log("---------------------------\n");
});