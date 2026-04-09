async function uploadToCatbox(base64: string) {
  const buf = Buffer.from(base64, "base64");
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", new Blob([buf]), "image.jpg");

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Catbox upload failed: " + res.status);
  return await res.text();
}

async function test() {
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  console.log(await uploadToCatbox(b64));
}
test();
