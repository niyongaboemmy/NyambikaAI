const buf = Buffer.from("test", "utf8");
fetch("https://transfer.sh/person.jpg", {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg", "Max-Days": "1" },
  body: buf,
}).then(res => console.log("transfer.sh:", res.status)).catch(e => console.error("transfer.sh:", e.message));
