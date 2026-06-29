// Native fetch is available in Node.js
const BASE_URL = 'https://api.classgrid.in';

async function step2() {
    console.log("🔑 Logging in...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'school_admin@classgrid.in', password: 'TestPassword123!', role: 'org_admin' })
    });
    const setCookieHeader = loginRes.headers.get('set-cookie');
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;

    console.log("🔄 Changing domain FROM: kkk.classgrid.in TO: skk.classgrid.in ...");
    await fetch(`${BASE_URL}/api/org-admin/subdomain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
        body: JSON.stringify({ subdomain: 'skk' })
    });
    console.log("✅ Done! You can now test it in your browser.");
}
step2();
