const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on("pageerror", (err) => {
        console.error("PAGE ERROR:", err.toString());
    });
    
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            console.error("CONSOLE ERROR:", msg.text());
        }
    });

    console.log("Navigating to http://localhost:4173/dept/admissions/enroll");
    await page.goto("http://localhost:4173/dept/admissions/enroll", { waitUntil: "networkidle0" });
    
    console.log("Wait for 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
})();
