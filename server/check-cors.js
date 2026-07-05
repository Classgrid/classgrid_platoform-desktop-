import { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function checkCors() {
    try {
        const getCommand = new GetBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME });
        const result = await r2.send(getCommand);
        console.log("Current CORS Configuration:");
        console.log(JSON.stringify(result.CORSRules, null, 2));
        
        // Force wildcard origins just to be safe
        console.log("\nSetting wildcard CORS to fix any matching issues...");
        const putCommand = new PutBucketCorsCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: ["ETag", "Content-Length", "Content-Type", "x-amz-request-id", "x-amz-id-2"],
                        MaxAgeSeconds: 3600,
                    },
                ],
            },
        });
        await r2.send(putCommand);
        console.log("✅ Set wildcard CORS!");
        
    } catch (err) {
        console.error("Error:", err);
    }
}

checkCors();
