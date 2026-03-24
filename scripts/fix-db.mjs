import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" }); // Next.js often uses .env.local

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const result = await db.collection("users").updateMany(
    { role: "USER" },
    {
      $set: {
        "permissions.canManageBlogs": false,
        "permissions.canManageComments": false,
        "permissions.canManagePages": false,
        "permissions.canManageUsers": false,
        "permissions.canSeeStats": false,
        "permissions.canViewBlogs": true,
      }
    }
  );
  console.log("Updated", result.modifiedCount, "users.");
  await client.close();
}
run();
