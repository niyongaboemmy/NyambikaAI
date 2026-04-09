import "dotenv/config";

async function run() {
  const apiKey = process.env.PIXELAPI_KEY;
  console.log("Using KEY length:", apiKey ? apiKey.length : 0);
  
  // 1x1 tiny transparent png data URL
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  const submitResp = await fetch("https://api.pixelapi.dev/v1/virtual-tryon", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      garment_image: b64,
      person_image: b64,
      category: "upperbody"
    })
  });
  
  const submitData = await submitResp.json();
  console.log("SUBMIT:", submitResp.status, submitData);
  
  if (!submitData.job_id) return;
  
  let i = 0;
  while (i < 10) {
    await new Promise(r => setTimeout(r, 2000));
    const p = await fetch(`https://api.pixelapi.dev/v1/virtual-tryon/jobs/${submitData.job_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const pData = await p.json();
    console.log("POLL:", pData);
    if (pData.status === "completed" || pData.status === "failed") break;
    i++;
  }
}
run();
