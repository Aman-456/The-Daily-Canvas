import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No URL");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const result = await db.collection("users").updateMany(
    { role: "USER" },
    {
      $unset: { "permissions.canViewBlogs": true },
      $set: { "permissions.canManageComments": true }
    }
  );
  console.log("Updated", result.modifiedCount, "users to set canManageComments and rm canView.");
  await client.close();
}
run();
