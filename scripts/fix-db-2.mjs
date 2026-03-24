import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" }); 

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
        "permissions.canManageBlogs": true,
      }
    }
  );
  console.log("Updated", result.modifiedCount, "users to restore canManageBlogs.");
  await client.close();
}
run();
