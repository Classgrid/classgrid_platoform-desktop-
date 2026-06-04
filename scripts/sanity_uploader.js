require('dotenv').config();
const { createClient } = require('@sanity/client');
const fs = require('fs');

// Initialize the standard Sanity Client with Write Access!
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a4wk6kp5',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-04-19',
  token: process.env.SANITY_API_WRITE_TOKEN,
});

// Powerful Markdown to Portable Text Parser 
function parseMarkdownToPortableText(markdownText) {
    const blocks = [];
    const paragraphs = markdownText.split(/\n\n+/);

    for (const para of paragraphs) {
        let text = para.trim();
        if (!text) continue;

        if (text.startsWith('### ')) {
            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: text.replace('###', '').trim(), marks: [] }]
            });
        } else if (text.startsWith('## ')) {
            blocks.push({
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: text.replace('##', '').trim(), marks: [] }]
            });
        } else if (text.startsWith('- ') || text.startsWith('* ')) {
            const listItems = text.split('\n');
            for (const item of listItems) {
                if (item.trim() === '') continue;
                blocks.push({
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    children: [{ _type: 'span', text: item.replace(/^[-*]\s*/, '').trim(), marks: [] }]
                });
            }
        } else {
             // Basic implementation: push generic block.
             // Full markdown parsing (with *strong* and [links]) requires extensive AST parsing.
             // For simplicity, we push plain paragraph text and handle simple bolding in strings.
             let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/---/g, '').trim();
             if (cleanText) {
                 blocks.push({
                     _type: 'block',
                     style: 'normal',
                     children: [{ _type: 'span', text: cleanText, marks: [] }]
                 });
             }
        }
    }
    return blocks;
}


async function uploadLegalPage(filepath, docId, pageType, headline) {
    try {
        console.log(`\n🚀 Reading [${headline}] from ${filepath}...`);
        if (!fs.existsSync(filepath)) {
            console.error(`❌ File not found: ${filepath}`);
            return;
        }

        const content = fs.readFileSync(filepath, 'utf8');
        console.log(`✅ Loaded ${content.length} characters.`);
        
        // Simplified Logic: Parse the entire text block into a single content array
        // (If mapping to policyPageType schemas, ensure fields match what Marketing expects!)
        const portableTextArray = parseMarkdownToPortableText(content);
        
        const doc = {
            _id: docId,
            _type: 'policyPage',
            pageType: pageType,
            headline: headline,
            lastUpdated: new Date().toISOString(),
            content: portableTextArray
        };

        console.log(`⏳ Uploading to Sanity Cloud => Project: ${client.config().projectId}`);
        const result = await client.createOrReplace(doc);
        console.log(`🎉 SUCCESS! Document uploaded. Sanity ID: ${result._id}`);
        
    } catch (error) {
        console.error(`💥 FAILED TO UPLOAD:`, error.message);
    }
}

// Ensure the token exists
if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error("❌ CRITICAL ERROR: SANITY_API_WRITE_TOKEN is missing from .env!");
    process.exit(1);
}

// Run the uploads!
async function run() {
    console.log("=========================================");
    console.log("   CLASSGRID SANITY UPLOADER PIPELINE    ");
    console.log("=========================================\n");
    // Example call for pushing Privacy Policy to Sanity
    // await uploadLegalPage('docs/CLASSGRID_PRIVACY_POLICY.md', 'privacy-policy-doc', 'privacy', 'Privacy Policy');
    
    console.log("\n✅ Setup complete! Replace or un-comment the lines above to run actual uploads!");
}

run();
