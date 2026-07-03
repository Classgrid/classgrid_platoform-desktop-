/**
 * Classgrid Load Test Script
 * ───────────────────────────
 * Uses `autocannon` to simulate high-throughput HTTP requests against the
 * Classgrid API server. Validates 4,000 RPS sustained throughput target.
 *
 * Prerequisites:
 *   npm install -D autocannon
 *
 * Usage:
 *   node scripts/load-test.js                          # Quick smoke test (10s, 100 connections)
 *   node scripts/load-test.js --target 4000            # Full 4K RPS validation
 *   node scripts/load-test.js --url https://app.classgrid.in  # Test production
 */

import autocannon from "autocannon";

const args = process.argv.slice(2);

function getArg(name, fallback) {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const BASE_URL = getArg("url", "https://api.classgrid.in");
const TARGET_RPS = parseInt(getArg("target", "100"));
const DURATION = parseInt(getArg("duration", "10")); // seconds
const CONNECTIONS = parseInt(getArg("connections", Math.min(TARGET_RPS, 500).toString()));

console.log("╔══════════════════════════════════════════════════╗");
console.log("║        CLASSGRID LOAD TEST                      ║");
console.log("╠══════════════════════════════════════════════════╣");
console.log(`║  Target URL:     ${BASE_URL.padEnd(31)}║`);
console.log(`║  Target RPS:     ${String(TARGET_RPS).padEnd(31)}║`);
console.log(`║  Duration:       ${(DURATION + "s").padEnd(31)}║`);
console.log(`║  Connections:    ${String(CONNECTIONS).padEnd(31)}║`);
console.log("╚══════════════════════════════════════════════════╝");
console.log("");

// ── Test Scenarios ──────────────────────────────────────────
const scenarios = [
    {
        name: "Health Check (GET /api/health)",
        url: `${BASE_URL}/api/health`,
        method: "GET",
    },
    {
        name: "Attendance Batch Insert Simulation (POST /api/external/faculty/attendance)",
        url: `${BASE_URL}/api/external/faculty/attendance`,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "LOAD_TEST_KEY",
        },
        body: JSON.stringify({
            biometricId: "LOAD_TEST_FACULTY",
            timestamp: new Date().toISOString(),
            type: "IN",
            deviceId: "load-test-device",
        }),
    },
];

async function runScenario(scenario) {
    console.log(`\n🔥 Running: ${scenario.name}`);
    console.log("─".repeat(50));

    return new Promise((resolve) => {
        const instance = autocannon({
            url: scenario.url,
            method: scenario.method || "GET",
            headers: scenario.headers || {},
            body: scenario.body || undefined,
            connections: CONNECTIONS,
            duration: DURATION,
            pipelining: 1,
        });

        autocannon.track(instance, { renderProgressBar: true });

        instance.on("done", (result) => {
            console.log(`\n📊 Results for: ${scenario.name}`);
            console.log(`   Requests/sec:  ${result.requests.average}`);
            console.log(`   Latency avg:   ${result.latency.average}ms`);
            console.log(`   Latency p99:   ${result.latency.p99}ms`);
            console.log(`   Throughput:    ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
            console.log(`   Total:         ${result.requests.total} requests`);
            console.log(`   Errors:        ${result.errors}`);
            console.log(`   Timeouts:      ${result.timeouts}`);
            console.log(`   2xx:           ${result["2xx"]}`);
            console.log(`   Non-2xx:       ${result.non2xx}`);

            const passed = result.requests.average >= TARGET_RPS;
            console.log(`   Target (${TARGET_RPS} RPS): ${passed ? "✅ PASSED" : "❌ FAILED"}`);

            resolve({ name: scenario.name, result, passed });
        });
    });
}

async function main() {
    const results = [];

    // Only run health check for the standard load test
    const scenarioToRun = TARGET_RPS >= 1000 ? scenarios : [scenarios[0]];

    for (const scenario of scenarioToRun) {
        const r = await runScenario(scenario);
        results.push(r);
    }

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║              FINAL SUMMARY                      ║");
    console.log("╠══════════════════════════════════════════════════╣");
    for (const r of results) {
        const icon = r.passed ? "✅" : "❌";
        console.log(`║  ${icon} ${r.name.substring(0, 45).padEnd(46)}║`);
        console.log(`║     ${String(r.result.requests.average + " RPS").padEnd(44)}║`);
    }
    console.log("╚══════════════════════════════════════════════════╝");

    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
    console.error("Load test failed:", err);
    process.exit(1);
});
