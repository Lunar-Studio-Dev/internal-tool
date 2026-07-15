import { randomBytes } from "crypto";

function generateSecret() {
    // Generates 32 random bytes (256 bits) and encodes them as a base64 string.
    // This satisfies better-auth's high-entropy requirements for production.
    const secret = randomBytes(32).toString("base64");

    console.log("\n🔒 Generated Better Auth Secret:\n");
    console.log(secret);
    console.log("\n✅ Add the following line to your .env file:\n");
    console.log(`BETTER_AUTH_SECRET="${secret}"\n`);
}

generateSecret();
