import { auth } from "../lib/auth";

async function main() {
  console.log("🌱 Seeding database...");

  const users = [
    {
      email: "disha@lunarstudio.dev",
      password: "disha@lunarstudio.dev",
      name: "Disha",
    },
  ];

  for (const user of users) {
    try {
      // Create user using better-auth's API to ensure passwords are hashed correctly
      const res = await auth.api.signUpEmail({
        body: {
          email: user.email,
          password: user.password,
          name: user.name,
        }
      });
      console.log(`✅ Successfully created user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to create user: ${user.email}`);
      console.error(error);
    }
  }

  console.log("✨ Seeding completed!");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Unexpected error during seeding:");
  console.error(e);
  process.exit(1);
});
