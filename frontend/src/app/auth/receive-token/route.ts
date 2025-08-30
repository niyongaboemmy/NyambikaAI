import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const redirect = searchParams.get("redirect") || "/";

  // Minimal HTML with inline script and meta refresh as double safety
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="2;url=${redirect.replace(/"/g, '')}">
    <title>Signing you in…</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b1220;color:#e6e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
      .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:24px 28px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:center}
      .spinner{display:inline-block;width:20px;height:20px;border:2px solid currentColor;border-top-color:transparent;border-radius:9999px;vertical-align:-4px;animation:spin 1s linear infinite;margin-right:8px}
      @keyframes spin{to{transform:rotate(360deg)}}
      .btn{margin-top:10px;display:inline-block;background:#2563eb;color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none}
    </style>
    <script>
      (function(){
        try {
          var t = ${JSON.stringify(token)};
          var r = ${JSON.stringify(redirect)} || "/";
          if (t && typeof window !== 'undefined') {
            try { localStorage.setItem('auth_token', t); } catch(e) {}
            // Clean URL and go
            window.location.replace(r);
            setTimeout(function(){ if (location.pathname.indexOf('/auth/receive-token')>-1) location.assign(r); }, 800);
          } else {
            // No token, go home
            window.location.replace(r);
          }
        } catch (e) {
          console.error('receive-token inline failed', e);
          try { window.location.replace('/'); } catch(_) {}
        }
      })();
    </script>
  </head>
  <body>
    <div class="card">
      <span class="spinner"></span>
      <span>Finishing sign-in…</span>
      <div><a class="btn" href="${redirect.replace(/"/g, '')}">Continue</a></div>
    </div>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow this HTML to be cached briefly if needed, but it's fine to disable caching
      "Cache-Control": "no-store",
    },
  });
}
