import "dotenv/config";
import { tryWithReplicate } from "./tryon" // Or something simpler

async function check() {
  try {
     console.log("PIXEL: " + process.env.PIXELAPI_KEY);
     const res = await fetch("https://api.pixelapi.dev/v1/virtual-tryon", { method: "POST" });
     console.log("STATUS:", res.status);
  } catch (e: any) {
     console.error("Fetch Error:", e.message);
  }
}
check();
