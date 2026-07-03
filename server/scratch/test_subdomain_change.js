// Native fetch is available in Node.js

const BASE_URL = 'https://api.classgrid.in'; // Assuming standard dev port

async function testSubdomainChange() {
    console.log("🚀 Starting Subdomain Edit Test...");

    // 1. Login to get token
    console.log("\n🔑 Logging in as school_admin@classgrid.in...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'school_admin@classgrid.in',
            password: 'TestPassword123!',
            role: 'org_admin'
        })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 && !loginData.user) {
        console.error("❌ Login failed:", loginData);
        return;
    }
    
    // Extract cookies
    const setCookieHeader = loginRes.headers.get('set-cookie');
    let cookies = '';
    if (setCookieHeader) {
        // Simple extraction (might be an array or string depending on fetch implementation)
        cookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
    }
    
    console.log("✅ Logged in successfully.");

    // Helper to make auth requests
    const authFetch = (path, method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            }
        };
        if (body) options.body = JSON.stringify(body);
        return fetch(`${BASE_URL}${path}`, options);
    };

    // 2. Get current subdomain to restore later
    const currentSubRes = await authFetch('/api/org-admin/subdomain');
    const currentSubData = await currentSubRes.json();
    const originalSubdomain = currentSubData.subdomain;
    console.log(`\n📌 Original subdomain is: ${originalSubdomain || 'None'}`);

    // 3. Set to a temporary subdomain 'test-school-old'
    console.log("\n🔄 Updating domain to: https://test-school-old.classgrid.in ...");
    await authFetch('/api/org-admin/subdomain', 'PATCH', { subdomain: 'test-school-old' });
    
    // 4. Verify 'test-school-old' works
    let checkRes = await fetch(`${BASE_URL}/api/public/auth-branding?slug=test-school-old`);
    let checkData = await checkRes.json();
    console.log(`📡 Checking https://test-school-old.classgrid.in: ${checkData.success ? '✅ WORKS (College Login Page Loads)' : '❌ FAILED'}`);

    // 5. Change subdomain to 'test-school-new' (EDITING DOMAIN)
    console.log("\n🔄 Changing domain FROM: https://test-school-old.classgrid.in TO: https://test-school-new.classgrid.in ...");
    await authFetch('/api/org-admin/subdomain', 'PATCH', { subdomain: 'test-school-new' });

    // 6. Verify OLD domain is broken
    checkRes = await fetch(`${BASE_URL}/api/public/auth-branding?slug=test-school-old`);
    checkData = await checkRes.json();
    console.log(`📡 Checking OLD domain (https://test-school-old.classgrid.in): ${!checkData.success ? '✅ BROKEN / KILLED (As expected)' : '❌ STILL WORKS (Cache issue!)'}`);

    // 7. Verify NEW domain works
    checkRes = await fetch(`${BASE_URL}/api/public/auth-branding?slug=test-school-new`);
    checkData = await checkRes.json();
    console.log(`📡 Checking NEW domain (https://test-school-new.classgrid.in): ${checkData.success ? '✅ WORKS (College Login Page Loads)' : '❌ FAILED'}`);

    // 8. Restore original
    console.log(`\n🧹 Restoring original domain to https://${originalSubdomain}.classgrid.in ...`);
    await authFetch('/api/org-admin/subdomain', 'PATCH', { subdomain: originalSubdomain || null });
    console.log("✅ Test complete!");
}

testSubdomainChange().catch(console.error);
