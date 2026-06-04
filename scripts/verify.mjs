import { createClient } from '@sanity/client';

const client = createClient({
  projectId: "a4wk6kp5",
  dataset: "production",
  apiVersion: "2026-04-20",
  useCdn: false
});

async function verify() {
  const doc = await client.fetch(`*[_type == "solutionModule" && slug.current == "smart-attendance"][0]{
    _id,
    slug,
    lastUpdatedAt,
    structuredSections
  }`);
  console.log(JSON.stringify(doc, null, 2));
}

verify();
