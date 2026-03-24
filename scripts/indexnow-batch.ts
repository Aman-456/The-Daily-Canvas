import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const APP_URL = "https://the-daily-thoughts.vercel.app";
const INDEXNOW_KEY = "df3ccbb1d0a942fc882435bcb0ae6acd";

const blogSchema = new mongoose.Schema({
  slug: String,
  isPublished: Boolean,
});
// Using a simple schema to avoid importing the whole Next.js app context
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

async function indexAll() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Make sure .env is loaded (npx tsx --env-file=.env scripts/indexnow-batch.ts)");
  }

  console.log("[IndexNow Batch] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("[IndexNow Batch] Connected to database.");

  console.log("[IndexNow Batch] Fetching all published blogs...");
  const blogs = await Blog.find({ isPublished: true, slug: { $exists: true } }).select("slug");
  
  const urlList = blogs.map((b) => `${APP_URL}/blogs/${b.slug}`);
  
  // Also push standard static routes
  urlList.push(`${APP_URL}/`);
  urlList.push(`${APP_URL}/about`);

  console.log(`[IndexNow Batch] Found ${urlList.length} total URLs to index.`);

  const payload = {
    host: "the-daily-thoughts.vercel.app",
    key: INDEXNOW_KEY,
    keyLocation: `https://the-daily-thoughts.vercel.app/${INDEXNOW_KEY}.txt`,
    urlList: urlList,
  };

  console.log("[IndexNow Batch] Submitting payload to Bing IndexNow API...");
  
  const res = await fetch("https://www.bing.com/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log("✅ [SUCCESS] Bulk submitted all URLs to IndexNow!");
  } else {
    console.error("❌ [FAILED] Status:", res.status);
    console.error(await res.text());
  }

  await mongoose.disconnect();
}

indexAll().catch(console.error);
